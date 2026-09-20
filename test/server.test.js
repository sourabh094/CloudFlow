const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");

const app = require("../server");

test("Todo API CRUD operations", async () => {
    const getResponse = await request(app)
        .get("/api/todos");

    assert.strictEqual(getResponse.statusCode, 200);
    assert.ok(Array.isArray(getResponse.body));

    const createResponse = await request(app)
        .post("/api/todos")
        .send({
            title: "Test Todo"
        });

    assert.strictEqual(createResponse.statusCode, 201);
    assert.strictEqual(createResponse.body.title, "Test Todo");
    assert.strictEqual(createResponse.body.completed, false);

    const todoId = createResponse.body.id;

    const updateResponse = await request(app)
        .put(`/api/todos/${todoId}`);

    assert.strictEqual(updateResponse.statusCode, 200);
    assert.strictEqual(updateResponse.body.completed, true);

    const deleteResponse = await request(app)
        .delete(`/api/todos/${todoId}`);

    assert.strictEqual(deleteResponse.statusCode, 200);
    assert.strictEqual(deleteResponse.body.id, todoId);
});