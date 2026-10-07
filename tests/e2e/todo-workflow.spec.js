const { test, expect } = require('@playwright/test');

class TodoPage {
  constructor(page) {
    this.page = page;
    this.createdTaskNames = [];
  }

  async open() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'To Do App' })).toBeVisible();
    await expect(this.page.getByRole('listitem').first()).toBeVisible();
  }

  task(name) {
    return this.page.getByRole('listitem').filter({ hasText: name });
  }

  async addTask(name, dueDate) {
    await this.page.getByLabel('Task name').fill(name);
    if (dueDate) {
      await this.page.getByLabel('Due date').fill(dueDate);
    }
    await this.page.getByRole('button', { name: 'Add task' }).click();
    await expect(this.task(name)).toBeVisible();
    this.createdTaskNames.push(name);
  }

  async editTask(name, updatedName, dueDate) {
    await this.task(name).getByRole('button', { name: `Edit ${name}` }).click();
    await this.page.getByLabel('Edit task name').fill(updatedName);
    await this.page.getByLabel('Edit due date').fill(dueDate);
    await this.page.getByRole('button', { name: 'Save changes' }).click();
    await expect(this.task(updatedName)).toBeVisible();
    this.createdTaskNames = this.createdTaskNames.map((taskName) => taskName === name ? updatedName : taskName);
  }

  async deleteTask(name) {
    await this.task(name).getByRole('button', { name: `Delete ${name}` }).click();
    await expect(this.task(name)).toHaveCount(0);
    this.createdTaskNames = this.createdTaskNames.filter((taskName) => taskName !== name);
  }

  async cleanup() {
    for (const name of this.createdTaskNames) {
      const task = this.task(name);
      if (await task.count()) {
        await task.getByRole('button', { name: `Delete ${name}` }).click();
        await expect(task).toHaveCount(0);
      }
    }
  }
}

let todo;

test.beforeEach(async ({ page }) => {
  todo = new TodoPage(page);
  await todo.open();
});

test.afterEach(async () => {
  await todo.cleanup();
});

test('creates a task with a due date', async () => {
  const name = `Add task ${Date.now()}`;
  await todo.addTask(name, '2099-12-31');
  await expect(todo.task(name).getByText('2099-12-31', { exact: true })).toBeVisible();
});

test('edits a task name and due date', async () => {
  const name = `Edit task ${Date.now()}`;
  const updatedName = `${name} updated`;
  await todo.addTask(name, '2099-12-31');
  await todo.editTask(name, updatedName, '2099-11-30');
  await expect(todo.task(updatedName).getByText('2099-11-30', { exact: true })).toBeVisible();
});

test('sorts tasks by due date with the earlier task first', async ({ page }) => {
  const suffix = Date.now();
  const laterName = `Later task ${suffix}`;
  const earlierName = `Earlier task ${suffix}`;
  await todo.addTask(laterName, '2099-12-31');
  await todo.addTask(earlierName, '2099-01-01');
  await page.getByLabel('Sort by').selectOption('due_date');

  const earlierRow = todo.task(earlierName);
  const laterRow = todo.task(laterName);
  const earlierIndex = await earlierRow.evaluate((row) => Array.from(row.parentElement.children).indexOf(row));
  const laterIndex = await laterRow.evaluate((row) => Array.from(row.parentElement.children).indexOf(row));
  expect(earlierIndex).toBeLessThan(laterIndex);
});

test('clears a task due date', async () => {
  const name = `Clear date ${Date.now()}`;
  await todo.addTask(name, '2099-12-31');
  await todo.editTask(name, name, '');
  await expect(todo.task(name).getByText('No due date')).toBeVisible();
});

test('deletes a task', async () => {
  const name = `Delete task ${Date.now()}`;
  await todo.addTask(name, null);
  await todo.deleteTask(name);
});
