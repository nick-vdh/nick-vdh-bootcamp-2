const request = require('supertest');
const { app, db } = require('../../src/app');

beforeEach(() => {
  db.prepare('DELETE FROM items').run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name = 'items'").run();
});

afterAll(() => {
  db.close();
});

const createTask = async (name = 'Test task', dueDate = null) => {
  const response = await request(app)
    .post('/api/items')
    .send({ name, due_date: dueDate });

  expect(response.status).toBe(201);
  return response.body;
};

describe('TODO task API', () => {
  test('creates a task with a due date', async () => {
    const response = await request(app)
      .post('/api/items')
      .send({ name: 'Submit report', due_date: '2026-11-12' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Submit report',
      due_date: '2026-11-12',
    });
  });

  test('rejects an invalid due date', async () => {
    const response = await request(app)
      .post('/api/items')
      .send({ name: 'Submit report', due_date: '2026-02-30' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/valid date/);
  });

  test('updates task fields and allows clearing the due date', async () => {
    const task = await createTask('Draft report', '2026-11-12');

    const nameUpdate = await request(app)
      .put(`/api/items/${task.id}`)
      .send({ name: 'Finalize report' });
    expect(nameUpdate.status).toBe(200);
    expect(nameUpdate.body).toMatchObject({
      name: 'Finalize report',
      due_date: '2026-11-12',
    });

    const dateUpdate = await request(app)
      .put(`/api/items/${task.id}`)
      .send({ due_date: null });
    expect(dateUpdate.status).toBe(200);
    expect(dateUpdate.body).toMatchObject({
      name: 'Finalize report',
      due_date: null,
    });
  });

  test('rejects empty names, invalid dates, and empty updates', async () => {
    const task = await createTask();

    const emptyName = await request(app)
      .put(`/api/items/${task.id}`)
      .send({ name: '  ' });
    const invalidDate = await request(app)
      .put(`/api/items/${task.id}`)
      .send({ due_date: 'not-a-date' });
    const emptyUpdate = await request(app)
      .put(`/api/items/${task.id}`)
      .send({});

    expect(emptyName.status).toBe(400);
    expect(invalidDate.status).toBe(400);
    expect(emptyUpdate.status).toBe(400);
  });

  test('returns not found for updates to missing tasks', async () => {
    const response = await request(app)
      .put('/api/items/99999')
      .send({ name: 'Missing task' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Item not found');
  });
});
