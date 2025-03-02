window.tutorialData = {
  lessons: [
    {
      id: "lesson1",
      title: { en: "Welcome to Stina AI", sv: "Välkommen till Stina AI" },
      pages: [
        {
          title: { en: "Introduction", sv: "Introduktion" },
          text: {
            en: "Welcome to **Stina AI**. This application helps you chat with a powerful AI assistant. You can send messages, attach files for analysis, generate summaries, and more. This brief introduction explains how the interface is laid out and what you can do with it.",
            sv: "Välkommen till **Stina AI**. Denna applikation hjälper dig att chatta med en kraftfull AI-assistent. Du kan skicka meddelanden, bifoga filer för analys, generera sammanfattningar och mer. Denna korta introduktion förklarar hur gränssnittet är uppbyggt och vad du kan göra.",
          },
          screenshot: "",
        },
        {
          title: { en: "Basic Navigation", sv: "Grundläggande navigering" },
          text: {
            en: "At the very top of the screen, you will see a navigation bar with buttons for:\n\n- **New Chat**: Start a new conversation\n- **Help**: Open or resume this tutorial\n- **Settings**: Configure providers, language, and more\n\nOn the left, you will see the chat list, where all your previous conversations are stored. You can click on any chat to reopen it.",
            sv: "Längst upp på skärmen ser du en navigationsrad med knappar för:\n\n- **Ny chat**: Starta en ny konversation\n- **Hjälp**: Öppna eller återuppta denna handledning\n- **Inställningar**: Konfigurera leverantörer, språk och mer\n\nTill vänster ser du en chattlista där alla dina tidigare konversationer är lagrade. Du kan klicka på vilken som helst av dem för att öppna den igen.",
          },
          screenshot: "",
        },
      ],
    },
    {
      id: "lesson2",
      title: { en: "Starting a New Chat", sv: "Starta en ny chat" },
      pages: [
        {
          title: {
            en: "Creating a New Conversation",
            sv: "Skapa en ny konversation",
          },
          text: {
            en: "To start a new conversation, click the **New Chat** button in the top navigation. This creates a fresh dialogue with the AI. You can type your question in the message box at the bottom and click the **Send** button.",
            sv: "För att starta en ny konversation, klicka på knappen **Ny chat** i den övre navigeringen. Detta skapar en ny dialog med AI:n. Du kan skriva din fråga i meddelanderutan längst ned och klicka på **Skicka**.",
          },
          screenshot: "",
        },
        {
          title: {
            en: "Renaming and Managing Chats",
            sv: "Byta namn och hantera chattar",
          },
          text: {
            en: 'By default, new conversations are titled "New Chat". The AI can generate a title once you send your first message. You can also rename a conversation by clicking on its title in the **left sidebar**. If you want to remove old chats, you can delete them by clicking the "×" button in the chat list.',
            sv: 'Som standard heter nya konversationer "Ny chat". AI:n kan generera en titel när du skickar ditt första meddelande. Du kan också byta namn på en konversation genom att klicka på dess titel i **vänstra sidofältet**. Om du vill ta bort gamla chattar kan du radera dem genom att klicka på "×"-knappen i chattlistan.',
          },
          screenshot: "",
        },
      ],
    },
    {
      id: "lesson3",
      title: { en: "Attaching Documents", sv: "Bifoga dokument" },
      pages: [
        {
          title: {
            en: "Adding PDFs, DOCX, and More",
            sv: "Lägga till PDF-filer, DOCX och mer",
          },
          text: {
            en: "Stina AI supports attaching files so the AI can read and analyze them. You can attach PDFs, text files, Markdown, or Word documents. Simply click the paperclip icon below the chat box and select your file. The file will show up in a list before sending, so you can confirm or remove it if needed.",
            sv: "Stina AI stöder att bifoga filer så att AI:n kan läsa och analysera dem. Du kan bifoga PDF-filer, textfiler, Markdown eller Word-dokument. Klicka bara på gem-ikonen under chattrutan och välj din fil. Filerna visas i en lista innan du skickar, så du kan bekräfta eller ta bort dem vid behov.",
          },
          screenshot: "",
        },
        {
          title: {
            en: "Ignoring or Summarizing Files",
            sv: "Ignorera eller sammanfatta filer",
          },
          text: {
            en: 'Once added, you can decide to **ignore** specific files or select a **summarized** version of a file to reduce token usage. Click on the file’s name to open a small menu where you can check "Ignore this document" or choose an existing summary.',
            sv: 'När filen är bifogad kan du välja att **ignorera** vissa filer eller välja en **sammanfattad** version av filen för att minska antalet token. Klicka på filens namn för att öppna en liten meny där du kan markera "Ignorera detta dokument" eller välja en befintlig sammanfattning.',
          },
          screenshot: "",
        },
      ],
    },
    {
      id: "lesson4",
      title: {
        en: "Generating Document Summaries",
        sv: "Generera dokumentsammanfattningar",
      },
      pages: [
        {
          title: {
            en: "Summaries Overview",
            sv: "Översikt över sammanfattningar",
          },
          text: {
            en: "Stina AI allows you to summarize large documents to stay within model token limits. After attaching a file, click on it and select **Generate Summary**. This opens a dialog where you can provide instructions and choose a model to produce a concise summary.",
            sv: "Stina AI gör det möjligt att sammanfatta stora dokument för att hålla sig inom modellens token-begränsningar. Efter att ha bifogat en fil klickar du på den och väljer **Generera sammanfattning**. Detta öppnar en dialog där du kan ange instruktioner och välja en modell för att skapa en kortfattad sammanfattning.",
          },
          screenshot: "",
        },
        {
          title: {
            en: "Using a Summary in Your Chat",
            sv: "Använda en sammanfattning i din chat",
          },
          text: {
            en: "Once a summary is generated, you can select it instead of the full file when chatting. Summaries reduce the overall token count, making the conversation shorter and more efficient.",
            sv: "När en sammanfattning har skapats kan du välja den istället för hela filen när du chattar. Sammanfattningar minskar det totala antalet tokens, vilket gör konversationen kortare och mer effektiv.",
          },
          screenshot: "",
        },
      ],
    },
    {
      id: "lesson5",
      title: {
        en: "Models and Instructions",
        sv: "Modeller och instruktioner",
      },
      pages: [
        {
          title: { en: "Choosing a Model", sv: "Välja en modell" },
          text: {
            en: "Below the chat box, you'll find a **Model Selection** menu. Depending on which providers are enabled, you can choose from Azure, OpenAI, Anthropic, Ollama, and more. Different models have different capabilities and token limits.",
            sv: "Under chattrutan hittar du en **Modellväljare**. Beroende på vilka leverantörer som är aktiverade kan du välja mellan Azure, OpenAI, Anthropic, Ollama och fler. Olika modeller har olika funktioner och token-begränsningar.",
          },
          screenshot: "",
        },
        {
          title: { en: "System Instructions", sv: "Systeminstruktioner" },
          text: {
            en: 'Some models allow you to set a custom "system" instruction to guide the AI\'s behavior. You can manage these instructions under the **Instructions** dropdown, and you can even add your own custom instructions.',
            sv: 'Vissa modeller tillåter dig att ställa in en anpassad "system"-instruktion för att styra AI:ns beteende. Du kan hantera dessa instruktioner under rullgardinsmenyn **Instruktioner**, och du kan även lägga till egna anpassade instruktioner.',
          },
          screenshot: "",
        },
      ],
    },
    {
      id: "lesson6",
      title: { en: "Settings", sv: "Inställningar" },
      pages: [
        {
          title: {
            en: "Configuring Providers and Language",
            sv: "Konfigurera leverantörer och språk",
          },
          text: {
            en: "Click the **Settings** button in the top navigation to open the settings modal. Here you can enable or disable providers (like Azure or OpenAI), enter API keys, set an endpoint, and change your interface language.",
            sv: "Klicka på knappen **Inställningar** i den övre navigeringen för att öppna inställningsfönstret. Här kan du aktivera eller inaktivera leverantörer (t.ex. Azure eller OpenAI), ange API-nycklar, sätta endpoint och byta språk för gränssnittet.",
          },
          screenshot: "",
        },
        {
          title: {
            en: "Saving and Applying Settings",
            sv: "Spara och tillämpa inställningar",
          },
          text: {
            en: "After entering your provider details or choosing a language, click **Save Changes**. Stina AI will remember these settings even if you close or refresh your browser.",
            sv: "När du har angett dina leverantörsuppgifter eller valt språk klickar du på **Spara ändringar**. Stina AI kommer ihåg dessa inställningar även om du stänger eller uppdaterar din webbläsare.",
          },
          screenshot: "",
        },
      ],
    },
    {
      id: "lesson7",
      title: { en: "Data Management", sv: "Hantering av data" },
      pages: [
        {
          title: { en: "Export and Import", sv: "Exportera och importera" },
          text: {
            en: "Inside **Settings** → **Data**, you can export individual or all chats as JSON. To import chats, simply drop or select a JSON file in the import area. This is handy if you want to back up chats or share them with someone else.",
            sv: "Under **Inställningar** → **Data** kan du exportera enskilda eller alla chattar som JSON. För att importera chattar drar eller väljer du bara en JSON-fil i importområdet. Detta är användbart om du vill säkerhetskopiera chattar eller dela dem med någon annan.",
          },
          screenshot: "",
        },
        {
          title: { en: "Clearing All Data", sv: "Rensa all data" },
          text: {
            en: "If you ever need to completely remove your data, you can click **Clear All Data**. Use this with caution, as it will erase all chats, custom instructions, and settings from your device.",
            sv: "Om du någon gång behöver ta bort all data helt och hållet kan du klicka på **Rensa all data**. Använd detta med försiktighet, eftersom det tar bort alla chattar, anpassade instruktioner och inställningar från din enhet.",
          },
          screenshot: "",
        },
      ],
    },
    {
      id: "lesson8",
      title: { en: "Finishing Up", sv: "Avslutning" },
      pages: [
        {
          title: { en: "Congratulations!", sv: "Grattis!" },
          text: {
            en: "You've learned the main features of **Stina AI**: 1. **Starting new chats** and managing them in the sidebar. 2. **Attaching files**, generating **summaries**, and ignoring documents. 3. **Selecting models** and customizing **instructions**. 4. Configuring **settings** for providers, language, and data management. We hope you enjoy using Stina AI. If you have any questions or need help, just revisit this tutorial by clicking the **Help** button in the top navigation.",
            sv: "Du har lärt dig huvudfunktionerna i **Stina AI**: 1. **Starta nya chattar** och hantera dem i sidofältet. 2. **Bifoga filer**, generera **sammanfattningar** och ignorera dokument. 3. **Välja modeller** och anpassa **instruktioner**. 4. Konfigurera **inställningar** för leverantörer, språk och datahantering. Vi hoppas att du får nytta av Stina AI. Om du har några frågor eller behöver hjälp, öppna gärna denna handledning igen genom att klicka på **Hjälp** i den övre navigeringen.",
          },
          screenshot: "",
        },
      ],
    },
  ],
};
