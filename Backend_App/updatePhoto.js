const db = require("./config/db");

db.query(
    "UPDATE users SET photo='images/userphoto.jpg' WHERE user_id=23",
    (err, result) => {
        if (err) {
            console.log("Error:", err);
        } else {
            console.log("Photo updated successfully");
        }
        process.exit();
    }
);
