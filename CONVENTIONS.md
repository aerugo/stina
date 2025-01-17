# Development Conventions

## Core Principles

1. **Client-Side Only**
   - Application must run completely client-side with no server requirements
   - Must be able to run by opening HTML file directly from filesystem
   - NO ES6 imports/exports (causes CORS issues when run from filesystem)

2. **Technology Stack**
   - JavaScript, HTML, and CSS only
   - Third-party libraries loaded via CDN in HTML file
   - No build tools or transpilation required

3. **Architecture**
   - Modular design with separate concerns:
     - Each module in its own file
     - Loaded via HTML script tags
     - Clear separation of logic, rendering, and user input
   - Functional programming style:
     - Use composition over inheritance
     - Minimize global variables and side effects
     - Use pure functions where possible
     - Prefer immutable data structures

4. **Documentation**
   - All code and comments in English
   - Clear documentation for all functions and modules
   - Only translations.js contains non-English strings

5. **Code Organization**
   - One module per file
   - Clear naming conventions
   - Consistent code formatting
   - Logical file structure

6. **Error Handling**
   - Graceful error handling
   - Clear error messages
   - Fallback behaviors where appropriate

7. **Browser Compatibility**
   - Support modern browsers
   - No reliance on cutting-edge features
   - Graceful degradation when needed

8. **Security**
   - No sensitive data in source code
   - Use template files for configuration
   - Sanitize user input
   - Secure API key handling

9. **Performance**
   - Minimize DOM operations
   - Efficient data structures
   - Avoid memory leaks
   - Clean up event listeners

10. **Testing**
    - Manual testing process
    - Test across different browsers
    - Test with different configurations
    - Document test cases
