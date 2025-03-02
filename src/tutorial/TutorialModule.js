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
  let modalElem, modalTitle, modalBody, modalFooter;
  
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
        <div class="modal-card" style="width: 80%; max-width: 900px;">
          <header class="modal-card-head">
            <p class="modal-card-title" id="tutorial-modal-title">Tutorial</p>
            <button class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body" style="display: flex; gap: 1rem;">
            <!-- Lessons sidebar -->
            <aside id="tutorial-lessons-list" style="width: 200px; border-right: 1px solid #eee;"></aside>
            <!-- Lesson content area -->
            <div id="tutorial-main-content" style="flex: 1;"></div>
          </section>
          <footer class="modal-card-foot" id="tutorial-modal-footer"></footer>
        </div>
      `;
      document.body.appendChild(existingModal);
      existingModal.querySelector(".modal-background").addEventListener("click", hideTutorialModal);
      existingModal.querySelector(".delete").addEventListener("click", hideTutorialModal);
    }
    modalElem = existingModal;
    modalTitle = existingModal.querySelector("#tutorial-modal-title");
    modalBody = existingModal.querySelector("#tutorial-main-content");
    modalFooter = existingModal.querySelector("#tutorial-modal-footer");
  }

  function renderLessonList() {
    const listContainer = modalElem.querySelector("#tutorial-lessons-list");
    listContainer.innerHTML = "";
    tutorialData.lessons.forEach(lesson => {
      const isCompleted = !!tutorialState.completedLessons[lesson.id];
      const lessonItem = document.createElement("div");
      lessonItem.style.padding = "0.5rem";
      lessonItem.style.cursor = "pointer";
      lessonItem.textContent = (isCompleted ? "✓ " : "") + localize(lesson.title);
      if (lesson.id === currentLessonId) {
        lessonItem.style.fontWeight = "bold";
      }
      lessonItem.addEventListener("click", () => {
        currentLessonId = lesson.id;
        currentPageIndex = 0;
        renderCurrentLesson();
      });
      listContainer.appendChild(lessonItem);
    });
    // Add a "Mark All Completed" button.
    const markAllBtn = document.createElement("button");
    markAllBtn.classList.add("button", "is-small", "is-info");
    markAllBtn.textContent = TranslationModule.translate("markAllCompleted");
    markAllBtn.style.marginTop = "1rem";
    markAllBtn.addEventListener("click", markAllLessonsComplete);
    listContainer.appendChild(markAllBtn);
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
    let contentHtml = `<div style="margin-bottom: 1rem;">
      <h3>${localize(currentPage.title)}</h3>
      <p>${localize(currentPage.text)}</p>
    </div>`;
    if (currentPage.screenshot) {
      contentHtml += `<img src="${currentPage.screenshot}" alt="Screenshot" style="max-width:100%; border:1px solid #ccc; margin-bottom:1rem;" />`;
    }
    modalBody.innerHTML = contentHtml;

    // Footer navigation buttons.
    modalFooter.innerHTML = "";
    const prevBtn = document.createElement("button");
    prevBtn.classList.add("button");
    prevBtn.textContent = "← Previous";
    prevBtn.disabled = (currentPageIndex === 0);
    prevBtn.addEventListener("click", () => {
      currentPageIndex--;
      renderCurrentLesson();
    });
    modalFooter.appendChild(prevBtn);

    const nextBtn = document.createElement("button");
    nextBtn.classList.add("button", "is-primary");
    nextBtn.textContent = (currentPageIndex < lesson.pages.length - 1) ? "Next →" : "Finish Lesson";
    nextBtn.addEventListener("click", async () => {
      if (currentPageIndex < lesson.pages.length - 1) {
        currentPageIndex++;
        renderCurrentLesson();
      } else {
        // Mark lesson as complete
        tutorialState.completedLessons[lesson.id] = true;
        // Determine if the current lesson is the last one in the tutorial
        const currentLessonIndex = tutorialData.lessons.findIndex(l => l.id === lesson.id);
        if (currentLessonIndex === tutorialData.lessons.length - 1) {
          // If this is the last lesson, mark all complete and close the modal.
          tutorialState.allCompleted = true;
          await saveTutorialState();
          updateHelpButtonHighlight();
          hideTutorialModal();
        } else {
          // Not the last lesson: navigate to the next lesson.
          const currentLessonIndex = tutorialData.lessons.findIndex(l => l.id === lesson.id);
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
    modalFooter.appendChild(nextBtn);
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
