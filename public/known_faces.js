cat << 'EOF' > /var/www/html/known_faces.js
const API_BASE = "/api/known-faces";
const token = localStorage.getItem("token");

if (!token) {
  document.getElementById("auth-error").style.display = "block";
  throw new Error("No auth token");
}

async function loadFaces() {
  const res = await fetch(API_BASE + "/list", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (!res.ok) return;

  const faces = await res.json();
  const list = document.getElementById("facesList");
  list.innerHTML = "";

  faces.forEach(face => {
    const li = document.createElement("li");
    li.textContent = face.first_name + " " + face.last_name + " (" + face.images + " images) ";

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = () => deleteFace(face.id);

    li.appendChild(del);
    list.appendChild(li);
  });
}

async function deleteFace(id) {
  await fetch(API_BASE + "/" + id, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token
    }
  });
  loadFaces();
}

document.getElementById("addFaceForm").addEventListener("submit", async e => {
  e.preventDefault();

  const form = new FormData();
  form.append("label", document.getElementById("label").value);
  form.append("image", document.getElementById("image").files[0]);

  await fetch(API_BASE + "/add", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token
    },
    body: form
  });

  e.target.reset();
  loadFaces();
});

loadFaces();
EOF
