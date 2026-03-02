// Debug script to check current user status
console.log("=== USER DEBUG INFO ===");
console.log("Token:", localStorage.getItem("token"));
console.log("User:", localStorage.getItem("user"));

const user = JSON.parse(localStorage.getItem("user"));
console.log("User role:", user?.role);
console.log("Is admin:", user?.role === "admin");

// Test navigation function
function testNavigate() {
  console.log("Testing navigation to /user-management");
  window.location.href = "/user-management";
}

// Add this to browser console to test
// testNavigate();
