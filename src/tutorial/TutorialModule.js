/**
 * TutorialModule
 * Manages loading and displaying an interactive tutorial with multiple lessons and pages.
 * Provides a responsive, accessible interface with keyboard navigation and markdown support.
 */
const TutorialModule = (function() {
  // State management
  let tutorialData = {};
  let tutorialState = {};
  let currentLessonId = null;
  let currentPageIndex = 0;
  let sidebarCollapsed = false;
  let isRendering = false; // Prevent concurrent rendering

  // DOM element references
  let modalElem, modalTitle, modalBody, modalFooter, progressBar, sidebarColumn, mainContentColumn;
  
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
        hasOpenedOnce: false
      };

      // Get tutorial data from window.tutorialData
      tutorialData = window.tutorialData || { lessons: [] };
      
      // Validate tutorial data structure
      if (!Array.isArray(tutorialData.lessons)) {
        console.warn("Tutorial data is not properly formatted. Expected an array of lessons.");
        tutorialData.lessons = [];
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
      document.addEventListener('keydown', handleKeyboardNavigation);
      
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
    if (!modalElem || !modalElem.classList.contains('is-active')) return;
    
    switch(event.key) {
      case 'Escape':
        hideTutorialModal();
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        // Navigate to next page
        const nextBtn = modalFooter.querySelector('.button.is-primary');
        if (nextBtn && !nextBtn.disabled) {
          nextBtn.click();
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        // Navigate to previous page
        const prevBtn = modalFooter.querySelector('.button.is-link.is-outlined');
        if (prevBtn && !prevBtn.disabled) {
          prevBtn.click();
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
      modalElem.setAttribute('role', 'dialog');
      modalElem.setAttribute('aria-modal', 'true');
      
      // Initialize to first lesson if none selected
      if (!currentLessonId && tutorialData.lessons.length > 0) {
        currentLessonId = tutorialData.lessons[0].id;
        currentPageIndex = 0;
      }
      
      renderLessonList();
      renderCurrentLesson();
      modalElem.classList.add("is-active");
      
      // Focus on the first interactive element for accessibility
      setTimeout(() => {
        const firstFocusable = modalElem.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
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
   * Hides the tutorial modal
   */
  function hideTutorialModal() {
    if (!modalElem) return;
    
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
        <div class="modal-card" style="max-width: 900px;">
          <header class="modal-card-head">
            <p class="modal-card-title" id="tutorial-modal-title">Tutorial</p>
            <button class="delete" aria-label="close"></button>
          </header>
          <div class="progress-container" style="padding: 0 1.5rem; background-color: var(--modal-header-footer-background);">
            <div class="columns is-mobile is-vcentered" style="margin-bottom: 0.5rem;">
              <div class="column is-narrow">
                <span class="has-text-weight-medium">
                  <span id="lesson-overview-label">${TranslationModule.translate("lessonOverview")}</span>
                </span>
              </div>
              <div class="column">
                <progress id="tutorial-progress" class="progress is-primary" value="0" max="100">0%</progress>
              </div>
            </div>
          </div>
          <section class="modal-card-body" style="padding: 0;">
            <div class="columns is-gapless" style="margin: 0; height: 100%; display: flex; width: 100%;">
              <div class="column sidebar-column" id="tutorial-sidebar-column" style="border-right: 1px solid #ddd; padding: 0; height: 100%; width: 25%; position: relative; flex: 0 0 25%;">
                <aside class="menu" style="padding: 1rem;">
                  <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                    <p class="menu-label">${TranslationModule.translate("tutorialLessons")}</p>
                    <button id="toggle-sidebar-btn" class="button is-small">
                      <span class="icon is-small">
                        <i class="fas fa-chevron-left"></i>
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
              <div class="column main-content-column" id="tutorial-main-content-column" style="padding: 0; flex: 1 1 75%;">
                <div class="card" style="box-shadow: none; height: 100%; border-radius: 0;">
                  <div class="card-content" id="tutorial-main-content">
                    <!-- Lesson content will be rendered here -->
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
      existingModal.querySelector(".modal-background").addEventListener("click", hideTutorialModal);
      existingModal.querySelector(".delete").addEventListener("click", hideTutorialModal);
      existingModal.querySelector("#mark-all-completed-btn").addEventListener("click", markAllLessonsComplete);
      existingModal.querySelector("#close-tutorial-btn").addEventListener("click", hideTutorialModal);
      existingModal.querySelector("#toggle-sidebar-btn").addEventListener("click", toggleSidebar);
    }
    modalElem = existingModal;
    modalTitle = existingModal.querySelector("#tutorial-modal-title");
    modalBody = existingModal.querySelector("#tutorial-main-content");
    modalFooter = existingModal.querySelector("#tutorial-modal-footer");
    progressBar = existingModal.querySelector("#tutorial-progress");
    sidebarColumn = existingModal.querySelector("#tutorial-sidebar-column");
    mainContentColumn = existingModal.querySelector("#tutorial-main-content-column");
  }

  /**
   * Renders the list of lessons in the sidebar
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
      
      // Add lesson number and completion status
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
            <i class="fas fa-circle"></i>
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
   * Toggles the sidebar visibility
   */
  function toggleSidebar() {
    if (isRendering) return;
    
    sidebarCollapsed = !sidebarCollapsed;
    const toggleBtn = modalElem.querySelector("#toggle-sidebar-btn");
    const columnsContainer = sidebarColumn.parentElement;
    
    // Ensure the container uses flexbox for proper layout
    columnsContainer.style.display = "flex";
    
    if (sidebarCollapsed) {
      // Collapse sidebar with animation
      sidebarColumn.classList.add('sidebar-collapsed');
      sidebarColumn.style.width = "40px";
      sidebarColumn.style.minWidth = "40px";
      sidebarColumn.style.maxWidth = "40px";
      sidebarColumn.querySelector("aside").style.display = "none";
      
      // Expand main content to fill the space
      mainContentColumn.style.width = "calc(100% - 40px)";
      mainContentColumn.style.flex = "1 1 auto";
      mainContentColumn.style.maxWidth = "none";
      
      // Create a new button to expand the sidebar
      const expandBtn = document.createElement("button");
      expandBtn.id = "expand-sidebar-btn";
      expandBtn.className = "button is-small";
      expandBtn.setAttribute("aria-label", TranslationModule.translate("expandSidebar"));
      expandBtn.style.position = "absolute";
      expandBtn.style.left = "5px";
      expandBtn.style.top = "10px";
      expandBtn.innerHTML = `<span class="icon is-small"><i class="fas fa-chevron-right"></i></span>`;
      expandBtn.setAttribute("title", TranslationModule.translate("expandSidebar"));
      expandBtn.addEventListener("click", toggleSidebar);
      
      // Add the expand button to the sidebar column
      sidebarColumn.appendChild(expandBtn);
    } else {
      // Expand sidebar with animation
      sidebarColumn.classList.remove('sidebar-collapsed');
      sidebarColumn.style.width = "25%";
      sidebarColumn.style.minWidth = "";
      sidebarColumn.style.maxWidth = "";
      sidebarColumn.querySelector("aside").style.display = "block";
      
      // Adjust main content width
      mainContentColumn.style.width = "75%";
      mainContentColumn.style.flex = "";
      mainContentColumn.style.maxWidth = "";
      
      // Remove the expand button if it exists
      const expandBtn = sidebarColumn.querySelector("#expand-sidebar-btn");
      if (expandBtn) {
        expandBtn.remove();
      }
      
      // Update the toggle button
      toggleBtn.innerHTML = `<span class="icon is-small"><i class="fas fa-chevron-left"></i></span>`;
      toggleBtn.setAttribute("title", TranslationModule.translate("collapseSidebar"));
    }
  }

  /**
   * Updates the progress bar and lesson overview label
   */
  function renderProgressBar() {
    if (!progressBar) return;
    
    const totalLessons = tutorialData.lessons.length;
    if (totalLessons === 0) return;
    
    // Calculate completion percentage
    const completedCount = Object.keys(tutorialState.completedLessons).length;
    const progressPercentage = Math.round((completedCount / totalLessons) * 100);
    
    // Update progress bar with animation
    const currentValue = parseInt(progressBar.value, 10);
    animateProgressBar(currentValue, progressPercentage);
    
    // Update lesson overview label
    const currentLessonIndex = tutorialData.lessons.findIndex(l => l.id === currentLessonId) + 1;
    const overviewLabel = modalElem.querySelector("#lesson-overview-label");
    if (overviewLabel) {
      overviewLabel.textContent = `${TranslationModule.translate("lessonOverview")} ${currentLessonIndex} ${TranslationModule.translate("of")} ${totalLessons}`;
    }
  }
  
  /**
   * Animates the progress bar from one value to another
   * @param {number} from - Starting percentage
   * @param {number} to - Target percentage
   */
  function animateProgressBar(from, to) {
    if (!progressBar) return;
    
    // Cancel any existing animation
    if (progressBar.animation) {
      clearInterval(progressBar.animation);
    }
    
    const duration = 500; // ms
    const steps = 20;
    const stepValue = (to - from) / steps;
    let currentStep = 0;
    let currentValue = from;
    
    progressBar.animation = setInterval(() => {
      currentStep++;
      currentValue += stepValue;
      
      if (currentStep >= steps) {
        currentValue = to;
        clearInterval(progressBar.animation);
        progressBar.animation = null;
      }
      
      progressBar.value = currentValue;
      progressBar.textContent = `${Math.round(currentValue)}%`;
      
      // Add aria attributes for accessibility
      progressBar.setAttribute('aria-valuenow', Math.round(currentValue));
      progressBar.setAttribute('aria-valuetext', `${Math.round(currentValue)}% complete`);
    }, duration / steps);
  }

  async function markAllLessonsComplete() {
    tutorialData.lessons.forEach(lesson => {
      tutorialState.completedLessons[lesson.id] = true;
    });
    tutorialState.allCompleted = true;
    await saveTutorialState();
    updateHelpButtonHighlight();
    renderLessonList();
    renderCurrentLesson();
  }

  /**
   * Renders the current lesson and page content
   */
  function renderCurrentLesson() {
    if (isRendering) return;
    isRendering = true;
    
    try {
      const lesson = tutorialData.lessons.find(l => l.id === currentLessonId);
      if (!lesson) {
        modalBody.innerHTML = "<div class='notification is-warning'>No lesson found.</div>";
        isRendering = false;
        return;
      }
      
      modalTitle.textContent = `Tutorial: ${localize(lesson.title)}`;

      const currentPage = lesson.pages[currentPageIndex];
      if (!currentPage) {
        modalBody.innerHTML = "<div class='notification is-warning'>No page found.</div>";
        isRendering = false;
        return;
      }
      
      // Create tabs for page navigation
      let tabsHtml = `
        <div class="tabs is-boxed" role="tablist">
          <ul>
      `;
      
      lesson.pages.forEach((page, index) => {
        const isActive = index === currentPageIndex;
        tabsHtml += `
          <li class="${isActive ? 'is-active' : ''}" role="presentation">
            <a data-page-index="${index}" 
               role="tab" 
               aria-selected="${isActive ? 'true' : 'false'}"
               aria-controls="page-${index}"
               title="${TranslationModule.translate("jumpToPage")} ${index + 1}">
              ${index + 1}
            </a>
          </li>
        `;
      });
      
      tabsHtml += `
          </ul>
        </div>
      `;
      
      // Process markdown in the text content
      const processedText = processMarkdown(localize(currentPage.text));
      
      // Create content with Bulma styling and integrated page tracker
      let contentHtml = `
        ${tabsHtml}
        <div class="content" id="page-${currentPageIndex}" role="tabpanel">
          <div class="level is-mobile">
            <div class="level-left">
              <h2 class="title is-3">${localize(currentPage.title)}</h2>
            </div>
            <div class="level-right">
              <span class="tag is-info is-medium">Page ${currentPageIndex + 1} of ${lesson.pages.length}</span>
            </div>
          </div>
          <div class="block tutorial-content">${processedText}</div>
      `;
      
      if (currentPage.screenshot) {
        contentHtml += `
          <figure class="image">
            <img src="${currentPage.screenshot}" alt="Screenshot of ${localize(currentPage.title)}" 
                 style="border:1px solid #ddd; border-radius:4px;">
          </figure>
        `;
      }
      
      contentHtml += `</div>`;
      
      // Update the DOM
      modalBody.innerHTML = contentHtml;
      modalBody.classList.add("fade-in");
      setTimeout(function() {
        modalBody.classList.remove("fade-in");
      }, 300);

      // Add event listeners to the tabs
      modalBody.querySelectorAll('.tabs li a').forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const pageIndex = parseInt(e.currentTarget.getAttribute('data-page-index'), 10);
          currentPageIndex = pageIndex;
          renderCurrentLesson();
        });
      });
      
      // Apply syntax highlighting to code blocks if highlight.js is available
      if (window.hljs) {
        modalBody.querySelectorAll('pre code').forEach((block) => {
          window.hljs.highlightElement(block);
        });
      }
    } catch (error) {
      console.error("Error rendering lesson:", error);
      modalBody.innerHTML = `<div class="notification is-danger">Error rendering lesson: ${error.message}</div>`;
    } finally {
      isRendering = false;
    }
  }
  
  /**
   * Processes markdown text into HTML
   * @param {string} text - The markdown text to process
   * @return {string} - The processed HTML
   */
  function processMarkdown(text) {
    // Use marked.js if available, otherwise do basic markdown processing
    if (window.marked) {
      return window.marked.parse(text);
    }
    
    // Basic markdown processing as fallback
    return text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      // Lists
      .replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      // Wrap in paragraph if not already
      .replace(/^(.+)$/, '<p>$1</p>');

    // Footer navigation buttons using Bulma level layout
    const closeBtn = modalFooter.querySelector("#close-tutorial-btn");
    modalFooter.innerHTML = "";
    const level = document.createElement("nav");
    level.className = "level";
    const levelLeft = document.createElement("div");
    levelLeft.className = "level-left";
    const leftItem = document.createElement("div");
    leftItem.className = "level-item";
    leftItem.appendChild(closeBtn);
    levelLeft.appendChild(leftItem);
    const levelRight = document.createElement("div");
    levelRight.className = "level-right";
    const navButtons = document.createElement("div");
    navButtons.className = "buttons level-item";
    
    const prevBtn = document.createElement("button");
    prevBtn.classList.add("button", "is-link", "is-outlined");
    prevBtn.innerHTML = `<span class="icon"><i class="fas fa-arrow-left"></i></span><span>${TranslationModule.translate("previous")}</span>`;
    prevBtn.disabled = (currentPageIndex === 0);
    prevBtn.addEventListener("click", () => {
      currentPageIndex--;
      renderCurrentLesson();
    });
    navButtons.appendChild(prevBtn);
    
    const nextBtn = document.createElement("button");
    nextBtn.classList.add("button", "is-primary");
    const isLastPage = currentPageIndex >= lesson.pages.length - 1;
    nextBtn.innerHTML = isLastPage ? 
      `<span>${TranslationModule.translate("finishLesson")}</span><span class="icon"><i class="fas fa-check"></i></span>` : 
      `<span>${TranslationModule.translate("next")}</span><span class="icon"><i class="fas fa-arrow-right"></i></span>`;
    nextBtn.addEventListener("click", async () => {
      if (currentPageIndex < lesson.pages.length - 1) {
        currentPageIndex++;
        renderCurrentLesson();
      } else {
        // Mark lesson as complete
        tutorialState.completedLessons[lesson.id] = true;
        const currentLessonIndex = tutorialData.lessons.findIndex(l => l.id === lesson.id);
        if (currentLessonIndex === tutorialData.lessons.length - 1) {
          tutorialState.allCompleted = true;
          await saveTutorialState();
          updateHelpButtonHighlight();
          renderProgressBar();
          hideTutorialModal();
        } else {
          const nextLesson = tutorialData.lessons[currentLessonIndex + 1];
          currentLessonId = nextLesson.id;
          currentPageIndex = 0;
          await saveTutorialState();
          updateHelpButtonHighlight();
          renderLessonList();
          renderCurrentLesson();
        }
      }
    });
    navButtons.appendChild(nextBtn);
    
    const levelRightItem = document.createElement("div");
    levelRightItem.className = "level-item";
    levelRightItem.appendChild(navButtons);
    levelRight.appendChild(levelRightItem);
    
    level.appendChild(levelLeft);
    level.appendChild(levelRight);
    modalFooter.appendChild(level);
  }

  async function saveTutorialState() {
    await StorageModule.saveData("tutorialState", tutorialState);
  }

  function updateHelpButtonHighlight() {
    const helpBtn = document.getElementById("help-btn");
    if (!helpBtn) return;
    if (tutorialState.allCompleted) {
      helpBtn.classList.remove("help-button-highlight");
    } else {
      helpBtn.classList.add("help-button-highlight");
    }
  }

  return {
    init,
    showTutorialModal,
    hideTutorialModal
  };
})();
