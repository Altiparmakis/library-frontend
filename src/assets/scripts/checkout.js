document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  //pre-fill the memberBarcode input
  const memberBarcodeParam = getQueryParam("memberBarcode");
  if (memberBarcodeParam) {
    document.getElementById("memberBarcode").value = memberBarcodeParam;
  }
  //pre-fill the the bookBarcode
  const bookBarcodeParam = getQueryParam("bookBarcode");
  if (bookBarcodeParam) {
    document.getElementById("bookBarcode").value = bookBarcodeParam;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const memberBarcode = document.getElementById("memberBarcode").value;
    const bookBarcode = document.getElementById("bookBarcode").value;
    console.log("memberBarcode", memberBarcode);
    console.log("bookBarcode", bookBarcode);
    Promise.all([
      fetchMemberIdByBarcode(memberBarcode),
      fetchBookIdByBarcode(bookBarcode),
    ])
      .then(([memberId, bookId]) => {
        console.log("memberId", memberId);
        console.log("bookId", bookId);
        if (memberId && bookId) {
          createCheckoutRegister(memberId, bookId);
        } else {
          alert("Invalid barcodes");
        }
      })
      .catch((error) => {
        console.error("Failed to create", error);
      });
  });
});
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
function fetchMemberIdByBarcode(barcode) {
  return fetch(
    `http://localhost:8080/api/members/search?barcodeNumber=${barcode}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch member");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      if (data.length > 0) {
        return data[0].id;
      } else {
        return null;
      }
    });
}
function fetchBookIdByBarcode(barcode) {
  return fetch(
    `http://localhost:8080/api/books/search?barcodeNumber=${barcode}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch book");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Full Response: ", data); // Check the entire response
      console.log("Book found with barcode: ", barcode, data);
      if (data.length > 0) {
        return data[0].id;
      } else {
        return null;
      }
    });
}
function createCheckoutRegister(memberId, bookId) {
  fetch(`http://localhost:8080/api/books/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch book");
      }
      return response.json();
    })
    .then((book) => {
      if (!book || book.noOfAvailableCopies <= 0) {
        alert("Checkout failed not copys available or book not found");
        throw new Error(
          "Checkout failed not copys available or book not found"
        );
      }
      const payload = {
        memberId: memberId,
        bookId: bookId,
        checkoutDate: new Date().toISOString().split("T")[0],
      };
      return fetch("http://localhost:8080/api/registers/createRegister", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to register ");
          }
          return response.json();
        })
        .then((register) => {
          return decreaseBookCopies(bookId);
        })
        .then(() => {
          alert("Book checkout successful and copies are updated");
          location.reload();
        })
        .catch((err) => {
          if (
            err.message !=
            "Checkout failed not copys available or book not found"
          ) {
            console.error("Unexpected error");
          }
        });
    });
}
function decreaseBookCopies(bookId) {
  return fetch(`http://localhost:8080/api/books/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to register ");
      }
      return response.json();
    })
    .then((book) => {
      const updateCopies = book.noOfAvailableCopies - 1;

      return fetch(`http://localhost:8080/api/books/updateBook/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ noOfAvailableCopies: updateCopies }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to patch ");
          }
          return response.json();
        })
        .catch((error) => {
          console.error(error);
          alert("Unexpected error while updating copies");
        });
    });
}
