const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let todos = [
    
];

// Home page
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>CloudFlow</title>

            <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    font-family: Arial, sans-serif;
                    background: #f4f6f8;
                    display: flex;
                    justify-content: center;
                    padding-top: 60px;
                }

                .container {
                    width: 500px;
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    text-align: center;
                    margin-bottom: 25px;
                }

                .input-area {
                    display: flex;
                    gap: 10px;
                }

                input[type="text"] {
                    flex: 1;
                    padding: 12px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 16px;
                }

                .add-btn {
                    padding: 12px 18px;
                    border: none;
                    border-radius: 6px;
                    background: #2563eb;
                    color: white;
                    cursor: pointer;
                }

                .add-btn:hover {
                    background: #1d4ed8;
                }

                ul {
                    list-style: none;
                    padding: 0;
                    margin-top: 25px;
                }

                li {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px;
                    margin-bottom: 10px;
                    background: #f8fafc;
                    border-radius: 6px;
                }

                .todo-title {
                    flex: 1;
                }

                .completed {
                    text-decoration: line-through;
                    color: #888;
                }

                .delete-btn {
                    border: none;
                    background: #dc2626;
                    color: white;
                    padding: 7px 10px;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .delete-btn:hover {
                    background: #b91c1c;
                }
            </style>
        </head>

        <body>

            <div class="container">

                <h1>CloudFlow</h1>

                <div class="input-area">
                    <input
                        type="text"
                        id="todoInput"
                        placeholder="Enter a todo..."
                    >

                    <button class="add-btn" onclick="addTodo()">
                        Add
                    </button>
                </div>

                <ul id="todoList"></ul>

            </div>

            <script>

                async function loadTodos() {

                    const response = await fetch("/api/todos");
                    const todos = await response.json();

                    const list = document.getElementById("todoList");

                    list.innerHTML = todos.map(todo => \`
                        <li>

                            <input
                                type="checkbox"
                                \${todo.completed ? "checked" : ""}
                                onchange="toggleTodo(\${todo.id})"
                            >

                            <span class="todo-title \${todo.completed ? "completed" : ""}">
                                \${todo.title}
                            </span>

                            <button
                                class="delete-btn"
                                onclick="deleteTodo(\${todo.id})"
                            >
                                Delete
                            </button>

                        </li>
                    \`).join("");
                }


                async function addTodo() {

                    const input = document.getElementById("todoInput");

                    if (!input.value.trim()) {
                        return;
                    }

                    await fetch("/api/todos", {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            title: input.value
                        })
                    });

                    input.value = "";

                    loadTodos();
                }


                async function toggleTodo(id) {

                    await fetch("/api/todos/" + id, {
                        method: "PUT"
                    });

                    loadTodos();
                }


                async function deleteTodo(id) {

                    await fetch("/api/todos/" + id, {
                        method: "DELETE"
                    });

                    loadTodos();
                }


                loadTodos();

            </script>

        </body>
        </html>
    `);
});

// Get all todos
app.get("/api/todos", (req, res) => {
    res.json(todos);
});

// Add todo
app.post("/api/todos", (req, res) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            message: "Todo title is required"
        });
    }

    const todo = {
        id: Date.now(),
        title: title.trim(),
        completed: false
    };

    todos.push(todo);

    res.status(201).json(todo);
});

// Toggle todo
app.put("/api/todos/:id", (req, res) => {
    const todo = todos.find(t => t.id == req.params.id);

    if (!todo) {
        return res.status(404).json({
            message: "Todo not found"
        });
    }

    todo.completed = !todo.completed;

    res.json(todo);
});

// Delete todo
app.delete("/api/todos/:id", (req, res) => {
    const index = todos.findIndex(t => t.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({
            message: "Todo not found"
        });
    }

    const deletedTodo = todos.splice(index, 1);

    res.json(deletedTodo[0]);
});

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;