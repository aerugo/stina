/**
 * TutorialModule
 * Manages loading and displaying an interactive tutorial with multiple lessons and pages.
 */
const TutorialModule = (function() {
  let tutorialData = {};
  let tutorialState = {};
  let currentLessonId = null;
  let currentPageIndex = 0;

  // References for modal elements.
  let modalElem, modalTitle, modalBody, modalFooter, progressBar;
  
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
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title" id="tutorial-modal-title">Tutorial</p>
            <button class="delete" aria-label="close"></button>
          </header>
          <div class="progress-container" style="padding: 0 1.5rem; background-color: var(--modal-header-footer-background);">
            <div class="columns is-mobile is-vcentered" style="margin-bottom: 0.5rem;">
              <div class="column is-narrow">
                <span class="has-text-weight-medium">${TranslationModule.translate("tutorialProgress")}:</span>
              </div>
              <div class="column">
                <progress id="tutorial-progress" class="progress is-primary" value="0" max="100">0%</progress>
              </div>
            </div>
          </div>
          <section class="modal-card-body" style="padding: 0;">
            <div class="columns is-gapless" style="margin: 0; height: 100%;">
              <div class="column is-3" style="border-right: 1px solid #ddd; padding: 0; height: 100%;">
                <aside class="menu" style="padding: 1rem;">
                  <p class="menu-label">${TranslationModule.translate("tutorialLessons")}</p>
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
              <div class="column is-9" id="tutorial-main-content-container" style="padding: 0;">
                <div class="card" style="box-shadow: none; height: 100%; border-radius: 0;">
                  <div class="card-content" id="tutorial-main-content">
                    <!-- Lesson content will be rendered here -->
                  </div>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot" id="tutorial-modal-footer"></footer>
        </div>
      `;
      document.body.appendChild(existingModal);
      existingModal.querySelector(".modal-background").addEventListener("click", hideTutorialModal);
      existingModal.querySelector(".delete").addEventListener("click", hideTutorialModal);
      existingModal.querySelector("#mark-all-completed-btn").addEventListener("click", markAllLessonsComplete);
    }
    modalElem = existingModal;
    modalTitle = existingModal.querySelector("#tutorial-modal-title");
    modalBody = existingModal.querySelector("#tutorial-main-content");
    modalFooter = existingModal.querySelector("#tutorial-modal-footer");
    progressBar = existingModal.querySelector("#tutorial-progress");
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

  function renderProgressBar() {
    if (!progressBar) return;
    
    const totalLessons = tutorialData.lessons.length;
    if (totalLessons === 0) return;
    
    const completedCount = Object.keys(tutorialState.completedLessons).length;
    const progressPercentage = Math.round((completedCount / totalLessons) * 100);
    
    progressBar.value = progressPercentage;
    progressBar.textContent = `${progressPercentage}%`;
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
    
    // Create content with Bulma styling
    let contentHtml = `
      <div class="content">
        <h3 class="title is-4">${localize(currentPage.title)}</h3>
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

    // Footer navigation buttons
    modalFooter.innerHTML = "";
    const btnContainer = document.createElement("div");
    btnContainer.className = "buttons is-centered";

    const prevBtn = document.createElement("button");
    prevBtn.classList.add("button", "is-link", "is-outlined");
    prevBtn.innerHTML = `<span class="icon"><i class="fas fa-arrow-left"></i></span><span>${TranslationModule.translate("previous")}</span>`;
    prevBtn.disabled = (currentPageIndex === 0);
    prevBtn.addEventListener("click", () => {
      currentPageIndex--;
      renderCurrentLesson();
    });
    btnContainer.appendChild(prevBtn);

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
          renderLessonList(); // This will also update the progress bar
          renderCurrentLesson();
        }
      }
    });
    btnContainer.appendChild(nextBtn);

    modalFooter.appendChild(btnContainer);
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
