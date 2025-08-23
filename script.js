// Wait for the DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners for smooth scrolling on all internal links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault(); // Prevents the default jump behavior

      // Get the element to scroll to
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        // Scroll to the target element with a smooth effect
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });
});
