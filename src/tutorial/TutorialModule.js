/**
 * TutorialModule
 * Manages an interactive, step-by-step tutorial system with improved UX/UI.
 * Features smooth transitions, better navigation, and enhanced accessibility.
 */
const TutorialModule = (function () {
  // State management
  let tutorialData = {};
  let tutorialState = {};
  let currentLessonId = null;
  let currentPageIndex = 0;
  let sidebarCollapsed = false;
  let isRendering = false; // Prevent concurrent rendering
  let touchStartX = 0; // For swipe detection

  // DOM element references
  let modalElem,
    modalTitle,
    modalBody,
    modalFooter,
    progressBar,
    sidebarColumn,
    mainContentColumn;

  /**
   * Localizes content based on the current language setting
   * @param {Object|string} field - The content to localize
   * @return {string} - The localized content
   */
  function localize(field) {
    if (typeof field === "object") {
      // Get the current language from config; default to English if not available.
      const { language } = ConfigModule.getConfig() || { language: "en" };
      return field[language] || field.en || "";
    }
    return field;
  }

  /**
   * Initializes the tutorial system
   * Loads saved state, attaches event handlers, and shows tutorial if first time
   */
  async function init() {
    try {
      // Load saved tutorial state or initialize defaults
      const storedState = await StorageModule.loadData("tutorialState");
      tutorialState = storedState || {
        completedLessons: {},
        allCompleted: false,
        hasOpenedOnce: false,
        lastLessonId: null,
        lastPageIndex: 0,
      };

      // Get tutorial data from window.tutorialData
      tutorialData = window.tutorialData || { lessons: [] };

      // Validate tutorial data structure
      if (!Array.isArray(tutorialData.lessons)) {
        console.warn(
          "Tutorial data is not properly formatted. Expected an array of lessons."
        );
        tutorialData.lessons = [];
      }

      // Restore last position if available
      if (tutorialState.lastLessonId) {
        currentLessonId = tutorialState.lastLessonId;
        currentPageIndex = tutorialState.lastPageIndex || 0;
      }

      // Auto-show the tutorial on first open if not completed
      if (!tutorialState.allCompleted && !tutorialState.hasOpenedOnce) {
        tutorialState.hasOpenedOnce = true;
        await saveTutorialState();
        showTutorialModal();
      }

      // Attach click to the help button
      const helpBtn = document.getElementById("help-btn");
      if (helpBtn) {
        helpBtn.addEventListener("click", showTutorialModal);
      }

      // Update help button appearance
      updateHelpButtonHighlight();

      // Add keyboard event listener for the document
      document.addEventListener("keydown", handleKeyboardNavigation);

      console.log("Tutorial module initialized successfully");
    } catch (error) {
      console.error("Error initializing tutorial module:", error);
    }
  }

  /**
   * Handles keyboard navigation within the tutorial
   * @param {KeyboardEvent} event - The keyboard event
   */
  function handleKeyboardNavigation(event) {
    // Only process keyboard events when the tutorial modal is active
    if (!modalElem || !modalElem.classList.contains("is-active")) return;

    switch (event.key) {
      case "Escape":
        hideTutorialModal();
        event.preventDefault();
        break;
      case "ArrowRight":
      case "ArrowDown":
      case " ": // Space key
        // Navigate to next page
        const nextBtn = modalFooter.querySelector(".button.is-primary");
        if (nextBtn && !nextBtn.disabled) {
          nextBtn.click();
          event.preventDefault();
        }
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "Backspace":
        // Navigate to previous page
        const prevBtn = modalFooter.querySelector(
          ".button.is-link.is-outlined"
        );
        if (prevBtn && !prevBtn.disabled) {
          prevBtn.click();
          event.preventDefault();
        }
        break;
      case "Home":
        // Go to first page of current lesson
        if (currentPageIndex > 0) {
          currentPageIndex = 0;
          renderCurrentLesson();
          event.preventDefault();
        }
        break;
      case "End":
        // Go to last page of current lesson
        const lesson = tutorialData.lessons.find(
          (l) => l.id === currentLessonId
        );
        if (lesson && currentPageIndex < lesson.pages.length - 1) {
          currentPageIndex = lesson.pages.length - 1;
          renderCurrentLesson();
          event.preventDefault();
        }
        break;
    }
  }

  /**
   * Shows the tutorial modal and renders content
   */
  function showTutorialModal() {
    if (isRendering) return;
    isRendering = true;

    try {
      createOrGetModalElements();

      // Set focus trap for accessibility
      modalElem.setAttribute("role", "dialog");
      modalElem.setAttribute("aria-modal", "true");

      // Initialize to first lesson if none selected
      if (!currentLessonId && tutorialData.lessons.length > 0) {
        currentLessonId = tutorialData.lessons[0].id;
        currentPageIndex = 0;
      } else if (currentLessonId) {
        // Ensure the lesson ID is valid
        const lessonExists = tutorialData.lessons.some(
          (lesson) => lesson.id === currentLessonId
        );
        if (!lessonExists && tutorialData.lessons.length > 0) {
          currentLessonId = tutorialData.lessons[0].id;
          currentPageIndex = 0;
        }
      }

      // Make the modal visible first so DOM elements are properly initialized
      modalElem.classList.add("is-active");

      // Then render content with a slight delay to ensure DOM is ready
      setTimeout(() => {
        renderLessonList();
        renderCurrentLesson();
      }, 50);

      // Focus on the first interactive element for accessibility
      setTimeout(() => {
        const firstFocusable = modalElem.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Error showing tutorial modal:", error);
    } finally {
      isRendering = false;
    }
  }

  /**
   * Hides the tutorial modal and saves current position
   */
  async function hideTutorialModal() {
    if (!modalElem) return;

    // Save current position before closing
    tutorialState.lastLessonId = currentLessonId;
    tutorialState.lastPageIndex = currentPageIndex;
    await saveTutorialState();

    modalElem.classList.remove("is-active");

    // Return focus to the help button for accessibility
    const helpBtn = document.getElementById("help-btn");
    if (helpBtn) {
      helpBtn.focus();
    }
  }

  function createOrGetModalElements() {
    let existingModal = document.getElementById("tutorial-modal");
    if (!existingModal) {
      existingModal = document.createElement("div");
      existingModal.id = "tutorial-modal";
      existingModal.classList.add("modal");
      existingModal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card" style="height: 80vh; display: flex; flex-direction: column;">
          <header class="modal-card-head">
            <p class="modal-card-title" id="tutorial-modal-title">Tutorial</p>
            <button class="delete" aria-label="close"></button>
          </header>
          <div class="progress-container" style="padding: 0 1.5rem; background-color: var(--tutorial-header-footer-background, var(--modal-header-footer-background));">
            <div class="columns is-mobile is-vcentered" style="margin-bottom: 0.5rem;">
              <div class="column is-narrow">
                <span class="has-text-weight-medium">
                  <span id="lesson-overview-label">${TranslationModule.translate(
                    "lessonOverview"
                  )}</span>
                </span>
              </div>
              <div class="column">
                <progress id="tutorial-progress" class="progress is-primary" value="0" max="100">0%</progress>
              </div>
            </div>
          </div>
          <section class="modal-card-body" style="padding: 0; flex-grow: 1; overflow: hidden;">
            <div class="columns is-gapless" style="margin: 0; height: 100%; display: flex; width: 100%;">
              <div class="column sidebar-column" id="tutorial-sidebar-column" style="border-right: 1px solid #ddd; padding: 0; height: 100%; width: 25%; position: relative; flex: 0 0 25%; transition: all 0.3s ease;">
                <aside class="menu" style="padding: 1rem; height: 100%; overflow-y: auto;">
                  <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                    <p class="menu-label">${TranslationModule.translate(
                      "tutorialLessons"
                    )}</p>
                    <button id="toggle-sidebar-btn" class="button is-small sidebar-toggle-btn" aria-label="${TranslationModule.translate(
                      "collapseSidebar"
                    )}">
                      <span class="icon is-small">
                        <img src="src/icons/sidebar.svg" alt="Toggle Sidebar" />
                      </span>
                    </button>
                  </div>
                  <ul class="menu-list" id="tutorial-lessons-list">
                    <!-- Lessons list will be rendered here -->
                  </ul>
                  <div class="mt-4">
                    <button id="mark-all-completed-btn" class="button is-small is-info is-fullwidth">
                      ${TranslationModule.translate("markAllCompleted")}
                    </button>
                  </div>
                </aside>
              </div>
              <div class="column main-content-column" id="tutorial-main-content-column" style="padding: 0; flex: 1 1 75%; height: 100%; overflow: hidden; transition: all 0.3s ease;">
                <div class="card" style="box-shadow: none; height: 100%; border-radius: 0; display: flex; flex-direction: column;">
                  <div class="card-content tutorial-card-content" id="tutorial-main-content" style="flex-grow: 1; overflow-y: auto; padding: 1.5rem;">
                    <!-- Lesson content will be rendered here -->
                  </div>
                  <div class="tutorial-pagination" style="padding: 0.75rem 1.5rem; border-top: 1px solid #ddd; display: flex; justify-content: center;">
                    <div class="pagination-dots" id="pagination-dots">
                      <!-- Pagination dots will be rendered here -->
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot" id="tutorial-modal-footer">
            <button id="close-tutorial-btn" class="button">
              ${TranslationModule.translate("closeTutorial")}
            </button>
            <div class="is-flex-grow-1"></div>
            <!-- Navigation buttons will be added here -->
          </footer>
        </div>
      `;
      document.body.appendChild(existingModal);

      // Add event listeners
      existingModal
        .querySelector(".modal-background")
        .addEventListener("click", hideTutorialModal);
      existingModal
        .querySelector(".delete")
        .addEventListener("click", hideTutorialModal);
      existingModal
        .querySelector("#mark-all-completed-btn")
        .addEventListener("click", markAllLessonsComplete);
      existingModal
        .querySelector("#close-tutorial-btn")
        .addEventListener("click", hideTutorialModal);
      existingModal
        .querySelector("#toggle-sidebar-btn")
        .addEventListener("click", toggleSidebar);

      // Add touch event listeners for swipe navigation
      const mainContent = existingModal.querySelector("#tutorial-main-content");
      mainContent.addEventListener("touchstart", handleTouchStart, false);
      mainContent.addEventListener("touchmove", handleTouchMove, false);
    }

    modalElem = existingModal;
    modalTitle = existingModal.querySelector("#tutorial-modal-title");
    modalBody = existingModal.querySelector("#tutorial-main-content");
    modalFooter = existingModal.querySelector("#tutorial-modal-footer");
    progressBar = existingModal.querySelector("#tutorial-progress");
    sidebarColumn = existingModal.querySelector("#tutorial-sidebar-column");
    mainContentColumn = existingModal.querySelector(
      "#tutorial-main-content-column"
    );
  }

  /**
   * Handle touch start event for swipe detection
   */
  function handleTouchStart(evt) {
    touchStartX = evt.touches[0].clientX;
  }

  /**
   * Handle touch move event for swipe detection
   */
  function handleTouchMove(evt) {
    if (!touchStartX) return;

    const touchEndX = evt.touches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Detect left/right swipe (threshold of 50px)
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - go to next page
        const nextBtn = modalFooter.querySelector(".button.is-primary");
        if (nextBtn && !nextBtn.disabled) {
          nextBtn.click();
        }
      } else {
        // Swipe right - go to previous page
        const prevBtn = modalFooter.querySelector(
          ".button.is-link.is-outlined"
        );
        if (prevBtn && !prevBtn.disabled) {
          prevBtn.click();
        }
      }

      // Reset touch start position
      touchStartX = 0;
    }
  }

  /**
   * Renders the list of lessons in the sidebar with improved styling
   */
  function renderLessonList() {
    if (!modalElem) return;

    const listContainer = modalElem.querySelector("#tutorial-lessons-list");
    if (!listContainer) return;

    // Clear existing content
    listContainer.innerHTML = "";

    // Create lesson items
    tutorialData.lessons.forEach((lesson, index) => {
      const isCompleted = !!tutorialState.completedLessons[lesson.id];
      const isActive = lesson.id === currentLessonId;

      const li = document.createElement("li");
      const a = document.createElement("a");

      // Set appropriate attributes for accessibility
      a.setAttribute("role", "button");
      a.setAttribute("aria-pressed", isActive ? "true" : "false");

      if (isActive) {
        a.classList.add("is-active");
      }

      // Add lesson number and completion status with improved icons
      if (isCompleted) {
        a.innerHTML = `
          <span class="icon has-text-success">
            <i class="fas fa-check-circle"></i>
          </span>
          <span>${index + 1}. ${localize(lesson.title)}</span>
        `;
      } else {
        a.innerHTML = `
          <span class="icon">
            <i class="far fa-circle"></i>
          </span>
          <span>${index + 1}. ${localize(lesson.title)}</span>
        `;
      }

      // Add click event
      a.addEventListener("click", () => {
        if (currentLessonId === lesson.id) return; // Already on this lesson

        currentLessonId = lesson.id;
        currentPageIndex = 0;
        renderCurrentLesson();
        renderLessonList(); // Re-render to update active state
      });

      li.appendChild(a);
      listContainer.appendChild(li);
    });

    // Update progress bar
    renderProgressBar();
  }

  /**
   * Toggles the sidebar visibility with improved animation
   */
  function toggleSidebar() {
    if (isRendering) return;

    sidebarCollapsed = !sidebarCollapsed;
    const toggleBtn = modalElem.querySelector("#toggle-sidebar-btn");

    if (sidebarCollapsed) {
      // Collapse sidebar with animation
      sidebarColumn.classList.add("sidebar-collapsed");
      sidebarColumn.style.width = "40px";
      sidebarColumn.style.minWidth = "40px";
      sidebarColumn.style.maxWidth = "40px";
      sidebarColumn.querySelector("aside").style.opacity = "0";
      sidebarColumn.querySelector("aside").style.visibility = "hidden";

      // Expand main content to fill the space
      mainContentColumn.style.width = "calc(100% - 40px)";

      // Create a new button to expand the sidebar
      const expandBtn = document.createElement("button");
      expandBtn.id = "expand-sidebar-btn";
      expandBtn.className = "button is-small is-primary sidebar-expand-btn";
      expandBtn.setAttribute(
        "aria-label",
        TranslationModule.translate("expandSidebar")
      );
      expandBtn.style.position = "absolute";
      expandBtn.style.left = "5px";
      expandBtn.style.top = "10px";
      expandBtn.innerHTML = `
        <span class="icon is-small"><img src="src/icons/sidebar.svg" alt="Toggle Sidebar" /></span>
      `;
      expandBtn.setAttribute(
        "title",
        TranslationModule.translate("expandSidebar")
      );
      expandBtn.addEventListener("click", toggleSidebar);

      // Add the expand button to the sidebar column
      setTimeout(() => {
        sidebarColumn.appendChild(expandBtn);
      }, 300); // Wait for the collapse animation to complete
    } else {
      // Expand sidebar with animation
      sidebarColumn.classList.remove("sidebar-collapsed");
      sidebarColumn.style.width = "25%";
      sidebarColumn.style.minWidth = "";
      sidebarColumn.style.maxWidth = "";

      // Remove the expand button if it exists
      const expandBtn = sidebarColumn.querySelector("#expand-sidebar-btn");
      if (expandBtn) {
        expandBtn.remove();
      }

      // Show the sidebar content with a fade-in effect
      setTimeout(() => {
        sidebarColumn.querySelector("aside").style.opacity = "1";
        sidebarColumn.querySelector("aside").style.visibility = "visible";
      }, 150);

      // Adjust main content width
      mainContentColumn.style.width = "75%";

      // Update the toggle button
      toggleBtn.innerHTML = `
        <span class="icon is-small"><img src="src/icons/sidebar.svg" alt="Toggle Sidebar" /></span>
      `;
      toggleBtn.setAttribute(
        "title",
        TranslationModule.translate("collapseSidebar")
      );
    }
  }

  /**
   * Updates the progress bar and lesson overview label with improved animation
   */
  function renderProgressBar() {
    if (!progressBar) return;

    const totalLessons = tutorialData.lessons.length;
    if (totalLessons === 0) return;

    // Calculate completion percentage
    const completedCount = Object.keys(tutorialState.completedLessons).length;
    const progressPercentage = Math.round(
      (completedCount / totalLessons) * 100
    );

    // Update progress bar with animation
    const currentValue = parseInt(progressBar.value, 10);
    animateProgressBar(currentValue, progressPercentage);

    // Update lesson overview label
    const currentLessonIndex =
      tutorialData.lessons.findIndex((l) => l.id === currentLessonId) + 1;
    const overviewLabel = modalElem.querySelector("#lesson-overview-label");
    if (overviewLabel) {
      overviewLabel.textContent = `${TranslationModule.translate(
        "lessonOverview"
      )} ${currentLessonIndex} ${TranslationModule.translate(
        "of"
      )} ${totalLessons}`;
    }
  }

  /**
   * Animates the progress bar from one value to another with improved easing
   * @param {number} from - Starting percentage
   * @param {number} to - Target percentage
   */
  function animateProgressBar(from, to) {
    if (!progressBar) return;

    // Cancel any existing animation
    if (progressBar.animation) {
      clearInterval(progressBar.animation);
    }

    const duration = 600; // ms
    const steps = 30;
    const stepValue = (to - from) / steps;
    let currentStep = 0;
    let currentValue = from;

    progressBar.animation = setInterval(() => {
      currentStep++;

      // Use easeOutQuad for smoother animation
      const progress = currentStep / steps;
      const easeValue = 1 - (1 - progress) * (1 - progress);
      currentValue = from + (to - from) * easeValue;

      if (currentStep >= steps) {
        currentValue = to;
        clearInterval(progress.animation);
        progressBar.animation = null;
      }

      progressBar.value = currentValue;
      progressBar.textContent = `${Math.round(currentValue)}%`;

      // Add aria attributes for accessibility
      progressBar.setAttribute("aria-valuenow", Math.round(currentValue));
      progressBar.setAttribute(
        "aria-valuetext",
        `${Math.round(currentValue)}% complete`
      );
    }, duration / steps);
  }

  /**
   * Marks all lessons as complete
   */
  async function markAllLessonsComplete() {
    tutorialData.lessons.forEach((lesson) => {
      tutorialState.completedLessons[lesson.id] = true;
    });
    tutorialState.allCompleted = true;
    await saveTutorialState();
    updateHelpButtonHighlight();
    renderLessonList();
    renderCurrentLesson();

    // Show a success message
    const successMessage = document.createElement("div");
    successMessage.className =
      "notification is-success is-light tutorial-completion-message";
    successMessage.innerHTML = `
      <button class="delete"></button>
      <p><strong>Congratulations!</strong> You've completed all tutorial lessons.</p>
    `;
    modalBody.prepend(successMessage);

    // Add event listener to close the message
    successMessage.querySelector(".delete").addEventListener("click", () => {
      successMessage.remove();
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.remove();
      }
    }, 5000);
  }

  /**
   * Renders the current lesson and page content with improved layout
   */
  function renderCurrentLesson() {
    if (isRendering) return;
    isRendering = true;

    try {
      // If no lesson is selected but lessons exist, select the first one
      if (!currentLessonId && tutorialData.lessons.length > 0) {
        currentLessonId = tutorialData.lessons[0].id;
        currentPageIndex = 0;
      }

      // Ensure we have a valid lesson
      const lesson = tutorialData.lessons.find((l) => l.id === currentLessonId);
      if (!lesson) {
        // If the current lesson ID doesn't exist in our data, select the first lesson
        if (tutorialData.lessons.length > 0) {
          currentLessonId = tutorialData.lessons[0].id;
          currentPageIndex = 0;
          // Try to find the lesson again with the updated ID
          const firstLesson = tutorialData.lessons[0];
          if (firstLesson) {
            renderLessonContent(firstLesson);
            return;
          }
        }

        modalBody.innerHTML =
          "<div class='notification is-warning'>No lesson found.</div>";
        isRendering = false;
        return;
      }

      // Render the lesson content
      renderLessonContent(lesson);
    } catch (error) {
      console.error("Error rendering lesson:", error);
      modalBody.innerHTML = `<div class="notification is-danger">Error rendering lesson: ${error.message}</div>`;
    } finally {
      isRendering = false;
    }
  }

  /**
   * Renders the content of a specific lesson
   * @param {Object} lesson - The lesson object to render
   */
  function renderLessonContent(lesson) {
    modalTitle.textContent = `${localize(lesson.title)}`;

    // Ensure we have a valid page index for this lesson
    if (currentPageIndex >= lesson.pages.length) {
      currentPageIndex = 0;
    }

    const currentPage = lesson.pages[currentPageIndex];
    if (!currentPage) {
      modalBody.innerHTML =
        "<div class='notification is-warning'>No page found.</div>";
      return;
    }

    // Process markdown in the text content
    const processedText = processMarkdown(localize(currentPage.text));

    // Create content with improved layout
    let contentHtml = `
      <div class="content" id="page-${currentPageIndex}" role="tabpanel">
        <div class="tutorial-header">
          <h2 class="title is-3">${localize(currentPage.title)}</h2>
          <div class="page-indicator">
            <span class="tag is-info is-medium">Page ${
              currentPageIndex + 1
            } of ${lesson.pages.length}</span>
          </div>
        </div>
        <div class="tutorial-content">${processedText}</div>
    `;

    if (currentPage.screenshot) {
      contentHtml += `
        <figure class="image tutorial-screenshot">
          <img src="${currentPage.screenshot}" alt="Screenshot of ${localize(
        currentPage.title
      )}" 
               style="border:1px solid #ddd; border-radius:8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </figure>
      `;
    }

    contentHtml += `</div>`;

    // Update the DOM with fade transition
    modalBody.style.opacity = "0";
    setTimeout(() => {
      modalBody.innerHTML = contentHtml;

      // Apply syntax highlighting to code blocks if highlight.js is available
      if (window.hljs) {
        modalBody.querySelectorAll("pre code").forEach((block) => {
          window.hljs.highlightElement(block);
        });
      }

      modalBody.style.opacity = "1";
    }, 150);

    // Render pagination dots
    renderPaginationDots(lesson.pages.length, currentPageIndex);

    // Render navigation buttons
    renderNavigationButtons(lesson);

    // Save current position
    tutorialState.lastLessonId = currentLessonId;
    tutorialState.lastPageIndex = currentPageIndex;
    saveTutorialState();
  }

  /**
   * Renders pagination dots for visual page indication
   * @param {number} totalPages - Total number of pages
   * @param {number} currentIndex - Current page index
   */
  function renderPaginationDots(totalPages, currentIndex) {
    const dotsContainer = modalElem.querySelector("#pagination-dots");
    if (!dotsContainer) return;

    dotsContainer.innerHTML = "";

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("span");
      dot.className =
        i === currentIndex ? "pagination-dot active" : "pagination-dot";
      dot.setAttribute("data-page", i);
      dot.setAttribute("role", "button");
      dot.setAttribute("tabindex", "0");
      dot.setAttribute("aria-label", `Go to page ${i + 1}`);

      // Add click event
      dot.addEventListener("click", () => {
        currentPageIndex = i;
        renderCurrentLesson();
      });

      // Add keyboard event for accessibility
      dot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          currentPageIndex = i;
          renderCurrentLesson();
          e.preventDefault();
        }
      });

      dotsContainer.appendChild(dot);
    }
  }

  /**
   * Renders navigation buttons in the footer
   * @param {Object} lesson - The current lesson object
   */
  function renderNavigationButtons(lesson) {
    // Clear existing buttons except close button
    const closeBtn = modalFooter.querySelector("#close-tutorial-btn");
    modalFooter.innerHTML = "";
    modalFooter.appendChild(closeBtn);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "tutorial-nav-buttons";

    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.classList.add("button", "is-link", "is-outlined");
    prevBtn.innerHTML = `<span class="icon"><i class="fas fa-arrow-left"></i></span><span>${TranslationModule.translate(
      "previous"
    )}</span>`;
    prevBtn.disabled = currentPageIndex === 0;
    prevBtn.addEventListener("click", () => {
      currentPageIndex--;
      renderCurrentLesson();
    });

    // Next/Finish button
    const nextBtn = document.createElement("button");
    nextBtn.classList.add("button", "is-primary");
    const isLastPage = currentPageIndex >= lesson.pages.length - 1;

    if (isLastPage) {
      nextBtn.innerHTML = `<span>${TranslationModule.translate(
        "finishLesson"
      )}</span><span class="icon"><i class="fas fa-check"></i></span>`;
    } else {
      nextBtn.innerHTML = `<span>${TranslationModule.translate(
        "next"
      )}</span><span class="icon"><i class="fas fa-arrow-right"></i></span>`;
    }

    nextBtn.addEventListener("click", async () => {
      if (currentPageIndex < lesson.pages.length - 1) {
        currentPageIndex++;
        renderCurrentLesson();
      } else {
        // Mark lesson as complete with visual feedback
        const oldButtonText = nextBtn.innerHTML;
        nextBtn.innerHTML = `<span class="icon"><i class="fas fa-spinner fa-spin"></i></span>`;
        nextBtn.disabled = true;

        tutorialState.completedLessons[lesson.id] = true;
        const currentLessonIndex = tutorialData.lessons.findIndex(
          (l) => l.id === lesson.id
        );

        await saveTutorialState();
        updateHelpButtonHighlight();

        // Add a small delay for visual feedback
        setTimeout(async () => {
          if (currentLessonIndex === tutorialData.lessons.length - 1) {
            tutorialState.allCompleted = true;
            await saveTutorialState();
            renderProgressBar();
            hideTutorialModal();
          } else {
            const nextLesson = tutorialData.lessons[currentLessonIndex + 1];
            currentLessonId = nextLesson.id;
            currentPageIndex = 0;
            renderLessonList();
            renderCurrentLesson();
          }
        }, 500);
      }
    });

    buttonContainer.appendChild(prevBtn);
    buttonContainer.appendChild(nextBtn);
    modalFooter.appendChild(buttonContainer);
  }

  /**
   * Processes markdown text into HTML with improved handling
   * @param {string} text - The markdown text to process
   * @return {string} - The processed HTML
   */
  function processMarkdown(text) {
    // Use marked.js if available
    if (window.marked) {
      // Configure marked for better security and features
      window.marked.setOptions({
        gfm: true,
        breaks: true,
        sanitize: false, // We'll use DOMPurify instead
        smartLists: true,
        smartypants: true,
        highlight: function (code, lang) {
          if (window.hljs && lang) {
            try {
              return window.hljs.highlight(code, { language: lang }).value;
            } catch (e) {
              return code;
            }
          }
          return code;
        },
      });

      // Parse markdown and sanitize with DOMPurify if available
      const html = window.marked.parse(text);
      return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
    }

    // Basic markdown processing as fallback
    return (
      text
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic text
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        // Lists
        .replace(/^\s*-\s+(.*?)$/gm, "<li>$1</li>")
        .replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>")
        // Paragraphs
        .replace(/\n\n/g, "</p><p>")
        // Wrap in paragraph if not already
        .replace(/^(.+)$/, "<p>$1</p>")
    );
  }

  /**
   * Saves the tutorial state to storage
   */
  async function saveTutorialState() {
    await StorageModule.saveData("tutorialState", tutorialState);
  }

  /**
   * Updates the help button highlight based on tutorial completion
   */
  function updateHelpButtonHighlight() {
    const helpBtn = document.getElementById("help-btn");
    if (!helpBtn) return;

    if (tutorialState.allCompleted) {
      helpBtn.classList.remove("help-button-highlight");
      helpBtn.setAttribute("title", "View Tutorial");
    } else {
      helpBtn.classList.add("help-button-highlight");
      helpBtn.setAttribute("title", "Continue Tutorial");
    }
  }

  return {
    init,
    showTutorialModal,
    hideTutorialModal,
  };
})();
