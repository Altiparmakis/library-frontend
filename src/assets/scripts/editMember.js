document.addEventListener("DOMContentLoaded", function () {
  const memberId = new URLSearchParams(window.location.search).get("id");
  if (!memberId) {
    console.error("No member ID specified in the URL");
    return;
  }
  document.getElementById("memberId").textContent = `${memberId}`;
  prefillForm(memberId);
});

function prefillForm(memberId) {
  fetch(`http://localhost:8080/api/members/${memberId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("failed to fetch member details");
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("firstname").value = data.firstName;
      document.getElementById("lastname").value = data.lastName;
      document.getElementById("dob").value = data.dateOfBirth;
      document.getElementById("streetName").value = data.address.streetName;
      document.getElementById("streetNo").value = data.address.streetNumber;
      document.getElementById("zipCode").value = data.address.zipCode;
      document.getElementById("placeName").value = data.address.placeName;
      document.getElementById("country").value = data.address.country;
      document.getElementById("addInfo").value = data.address.additionalInfo;
      document.getElementById("email").value = data.email;
      document.getElementById("phone").value = data.phone;
      document.getElementById("barcode").value = data.barcodeNumber;
    })
    .catch((err) => {
      console.error("Unexpected error: " + err);
    });
}

document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();
  const memberId = new URLSearchParams(window.location.search).get("id");
  const formData = {
    firstName: document.getElementById("firstname").value,
    lastName: document.getElementById("lastname").value,
    dateOfBirth: document.getElementById("dob").value,
    address: {
      streetName: document.getElementById("streetName").value,
      streetNumber: document.getElementById("streetNo").value,
      zipCode: document.getElementById("zipCode").value,
      placeName: document.getElementById("placeName").value,
      country: document.getElementById("country").value,
      additionalInfo: document.getElementById("addInfo").value,
    },
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    barcodeNumber: document.getElementById("barcode").value,
  };
  updateMemberData(memberId, formData);
});
function updateMemberData(id, data) {
  fetch(`http://localhost:8080/api/members/updateMember/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("failed to fetch patch");
      }
      return response.json();
    })
    .catch((err) => {
      console.error("Unxpected error: " + err);
    });
}
