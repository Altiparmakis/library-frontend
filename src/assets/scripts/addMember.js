document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    console.log("Today ", today);
    const formData = {
      firstName: document.getElementById("firstname").value,
      lastName: document.getElementById("lastname").value,
      dateOfBirth: document.getElementById("dob").value,
      email: document.getElementById("email").value,
      address: {
        streetName: document.getElementById("streetName").value,
        streetNumber: document.getElementById("streetNo").value,
        zipCode: document.getElementById("zipCode").value,
        placeName: document.getElementById("placeName").value,
        country: document.getElementById("country").value,
        additionalInfo: document.getElementById("addInfo").value,
      },
      phone: document.getElementById("phone").value,
      barcodeNumber: document.getElementById("barcode").value,
      memberShipStarted: today,
      isActive: true,
    };
    addNewMember(formData, form);
  });
});
function addNewMember(formData, form) {
  fetch("http://localhost:8080/api/members/addMember", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to add new member");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Member added succesfully", data);
      alert("New member added succesfully!");
      form.reset();
    })
    .catch((error) => {
      console.log("Error ", error);
      alert("An error occured");
    });
}
