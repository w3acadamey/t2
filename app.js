// Firebase Realtime Database URL
const databaseURL = "https://login-40b17-default-rtdb.firebaseio.com/";
const userId = "user1"; // Example user ID for demonstration

// Functions to interact with Firebase Realtime Database

// Write data
document.getElementById("write-button").addEventListener("click", () => {
    const name = document.getElementById("name").value;
    const age = parseInt(document.getElementById("age").value);
    const data = { name, age };

    fetch(`${databaseURL}users/${userId}.json`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("output").textContent = "Data written successfully";
    })
    .catch(error => console.error("Error writing data:", error));
});

// Read data
document.getElementById("read-button").addEventListener("click", () => {
    fetch(`${databaseURL}users/${userId}.json`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("output").textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error("Error reading data:", error));
});

// Update data
document.getElementById("update-button").addEventListener("click", () => {
    const age = parseInt(document.getElementById("age").value);
    const updateData = { age };

    fetch(`${databaseURL}users/${userId}.json`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("output").textContent = "Data updated successfully";
    })
    .catch(error => console.error("Error updating data:", error));
});

// Delete data
document.getElementById("delete-button").addEventListener("click", () => {
    fetch(`${databaseURL}users/${userId}.json`, {
        method: "DELETE"
    })
    .then(() => {
        document.getElementById("output").textContent = "Data deleted successfully";
    })
    .catch(error => console.error("Error deleting data:", error));
});
