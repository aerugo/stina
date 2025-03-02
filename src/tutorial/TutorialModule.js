/**
 * TutorialModule
 * Manages loading and displaying an interactive tutorial with multiple lessons and pages.
 */
const TutorialModule = (function() {
  let tutorialData = {};
  let tutorialState = {};
  let currentLessonId = null;
  let currentPageIndex = 0;
  let sidebarCollapsed = false;

  // References for modal elements.
  let modalElem, modalTitle, modalBody, modalFooter, progressBar, sidebarColumn, mainContentColumn;
  
  function localize(field) {
    if (typeof field === "object") {
      // Get the current language from config; default to English if not available.
      const { language } = ConfigModule.getConfig() || { language: "en" };
      return field[language] || field.en || "";
    }
    return field;
  }

  // Initialize the tutorial system.
  async function init() {
    // Load saved tutorial state or initialize defaults.
    const storedState = await StorageModule.loadData("tutorialState");
    tutorialState = storedState || {
      completedLessons: {},
      allCompleted: false
    };

    // Get tutorial data from window.tutorialData.
    tutorialData = window.tutorialData || { lessons: [] };

    // Auto-show the tutorial on first open if not completed.
    if (!tutorialState.allCompleted && !tutorialState.hasOpenedOnce) {
      tutorialState.hasOpenedOnce = true;
      await saveTutorialState();
      showTutorialModal();
    }

    // Attach click to the help button.
    const helpBtn = document.getElementById("help-btn");
    if (helpBtn) {
      helpBtn.addEventListener("click", showTutorialModal);
    }
    updateHelpButtonHighlight();
  }

  function showTutorialModal() {
    createOrGetModalElements();
    renderLessonList();

    if (!currentLessonId && tutorialData.lessons.length > 0) {
      currentLessonId = tutorialData.lessons[0].id;
      currentPageIndex = 0;
    }
    renderCurrentLesson();
    modalElem.classList.add("is-active");
  }

  function hideTutorialModal() {
    modalElem.classList.remove("is-active");
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
            <div class="columns is-gapless" style="margin: 0; height: 100%;">
              <div class="column sidebar-column" id="tutorial-sidebar-column" style="border-right: 1px solid #ddd; padding: 0; height: 100%; width: 25%; position: relative;">
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
              <div class="column main-content-column" id="tutorial-main-content-column" style="padding: 0;">
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

  function renderLessonList() {
    const listContainer = modalElem.querySelector("#tutorial-lessons-list");
    listContainer.innerHTML = "";
    
    tutorialData.lessons.forEach(lesson => {
      const isCompleted = !!tutorialState.completedLessons[lesson.id];
      const isActive = lesson.id === currentLessonId;
      
      const li = document.createElement("li");
      const a = document.createElement("a");
      
      if (isActive) {
        a.classList.add("is-active");
      }
      
      if (isCompleted) {
        a.innerHTML = `<span class="icon"><i class="fas fa-check"></i></span> ${localize(lesson.title)}`;
      } else {
        a.textContent = localize(lesson.title);
      }
      
      a.addEventListener("click", () => {
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

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    const toggleBtn = modalElem.querySelector("#toggle-sidebar-btn");
    
    if (sidebarCollapsed) {
      // Collapse sidebar
      sidebarColumn.style.width = "30px";
      sidebarColumn.style.minWidth = "30px";
      sidebarColumn.querySelector("aside").style.display = "none";
      mainContentColumn.style.width = "calc(100% - 30px)";
      
      // Create a new button to expand the sidebar
      const expandBtn = document.createElement("button");
      expandBtn.id = "expand-sidebar-btn";
      expandBtn.className = "button is-small";
      expandBtn.style.position = "absolute";
      expandBtn.style.left = "5px";
      expandBtn.style.top = "10px";
      expandBtn.innerHTML = `<span class="icon is-small"><i class="fas fa-chevron-right"></i></span>`;
      expandBtn.setAttribute("title", TranslationModule.translate("expandSidebar"));
      expandBtn.addEventListener("click", toggleSidebar);
      
      // Add the expand button to the sidebar column
      sidebarColumn.appendChild(expandBtn);
    } else {
      // Expand sidebar
      sidebarColumn.style.width = "25%";
      sidebarColumn.style.minWidth = "";
      sidebarColumn.querySelector("aside").style.display = "block";
      mainContentColumn.style.width = "75%";
      
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

  function renderProgressBar() {
    if (!progressBar) return;
    
    const totalLessons = tutorialData.lessons.length;
    if (totalLessons === 0) return;
    
    const completedCount = Object.keys(tutorialState.completedLessons).length;
    const progressPercentage = Math.round((completedCount / totalLessons) * 100);
    
    progressBar.value = progressPercentage;
    progressBar.textContent = `${progressPercentage}%`;
    
    // Update lesson overview label
    const currentLessonIndex = tutorialData.lessons.findIndex(l => l.id === currentLessonId) + 1;
    const overviewLabel = modalElem.querySelector("#lesson-overview-label");
    if (overviewLabel) {
      overviewLabel.textContent = `${TranslationModule.translate("lessonOverview")} ${currentLessonIndex} ${TranslationModule.translate("of")} ${totalLessons}`;
    }
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

  function renderCurrentLesson() {
    const lesson = tutorialData.lessons.find(l => l.id === currentLessonId);
    if (!lesson) {
      modalBody.innerHTML = "<p>No lesson found.</p>";
      return;
    }
    modalTitle.textContent = `Tutorial: ${localize(lesson.title)}`;

    const currentPage = lesson.pages[currentPageIndex];
    if (!currentPage) {
      modalBody.innerHTML = "<p>No page found.</p>";
      return;
    }
    
    // Create tabs for page navigation
    let tabsHtml = `
      <div class="tabs is-boxed">
        <ul>
    `;
    
    lesson.pages.forEach((page, index) => {
      const isActive = index === currentPageIndex;
      tabsHtml += `
        <li class="${isActive ? 'is-active' : ''}">
          <a data-page-index="${index}" title="${TranslationModule.translate("jumpToPage")} ${index + 1}">
            ${index + 1}
          </a>
        </li>
      `;
    });
    
    tabsHtml += `
        </ul>
      </div>
    `;
    
    // Create content with Bulma styling and integrated page tracker
    let contentHtml = `
      ${tabsHtml}
      <div class="content">
        <div class="level is-mobile">
          <div class="level-left">
            <h2 class="title is-3">${localize(currentPage.title)}</h2>
          </div>
          <div class="level-right">
            <span class="tag is-info is-medium">Page ${currentPageIndex + 1} of ${lesson.pages.length}</span>
          </div>
        </div>
        <div class="block">${localize(currentPage.text)}</div>
    `;
    
    if (currentPage.screenshot) {
      contentHtml += `
        <figure class="image">
          <img src="${currentPage.screenshot}" alt="Screenshot" style="border:1px solid #ddd; border-radius:4px;">
        </figure>
      `;
    }
    
    contentHtml += `</div>`;
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
