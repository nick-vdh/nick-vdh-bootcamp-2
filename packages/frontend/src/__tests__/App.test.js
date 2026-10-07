import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const initialItems = [
	{ id: 1, name: 'Test Item 1', due_date: '2026-12-31', created_at: '2026-01-01T00:00:00.000Z' },
	{ id: 2, name: 'Test Item 2', due_date: '2026-10-10', created_at: '2026-01-02T00:00:00.000Z' },
	{ id: 3, name: 'No date task', due_date: null, created_at: '2026-01-03T00:00:00.000Z' },
];

const createTaskRequest = jest.fn();
const updateTaskRequest = jest.fn();

const server = setupServer(
	rest.get('/api/items', (request, response, context) => response(context.json(initialItems))),
	rest.post('/api/items', async (request, response, context) => {
		const body = await request.json();
		createTaskRequest(body);
		const { name, due_date: dueDate } = body;
		return response(context.status(201), context.json({
			id: 4,
			name,
			due_date: dueDate,
			created_at: '2026-01-04T00:00:00.000Z',
		}));
	}),
	rest.put('/api/items/:id', async (request, response, context) => {
		const body = await request.json();
		updateTaskRequest({ id: request.params.id, ...body });
		const { name, due_date: dueDate } = body;
		return response(context.json({
			id: Number(request.params.id),
			name,
			due_date: dueDate,
			created_at: '2026-01-01T00:00:00.000Z',
		}));
	}),
);

beforeAll(() => server.listen());
beforeEach(() => {
	createTaskRequest.mockClear();
	updateTaskRequest.mockClear();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App component', () => {
	test('renders the application heading', () => {
		render(<App />);
		expect(screen.getByRole('heading', { name: 'To Do App' })).toBeInTheDocument();
		expect(screen.getByText('Keep track of your tasks')).toBeInTheDocument();
	});

	test('loads tasks and their due dates', async () => {
		render(<App />);
		expect(screen.getByRole('status')).toHaveTextContent('Loading tasks...');
		expect(await screen.findByText('Test Item 1')).toBeInTheDocument();
		expect(screen.getByText('2026-12-31')).toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	test('creates a task with a due date', async () => {
		const user = userEvent.setup();
		render(<App />);
		await screen.findByText('Test Item 1');
		await user.type(screen.getByLabelText('Task name'), 'New Test Item');
		await user.type(screen.getByLabelText('Due date'), '2026-11-05');
		await user.click(screen.getByRole('button', { name: 'Add task' }));
		await screen.findByText('New Test Item');
		const createdTaskRow = screen.getAllByRole('listitem').find((row) => within(row).queryByText('New Test Item'));
		expect(createdTaskRow).toBeDefined();
		expect(within(createdTaskRow).getByText('2026-11-05', { exact: true })).toBeInTheDocument();
		expect(createTaskRequest).toHaveBeenCalledWith({ name: 'New Test Item', due_date: '2026-11-05' });
	});

	test('edits a task name and due date', async () => {
		const user = userEvent.setup();
		render(<App />);
		await screen.findByText('Test Item 1');
		const originalTaskCount = screen.getAllByRole('listitem').length;
		await user.click(screen.getByRole('button', { name: 'Edit Test Item 1' }));
		const nameInput = screen.getByLabelText('Edit task name');
		await user.clear(nameInput);
		await user.type(nameInput, 'Updated task');
		await user.clear(screen.getByLabelText('Edit due date'));
		await user.type(screen.getByLabelText('Edit due date'), '2026-11-12');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));
		expect(await screen.findByText('Updated task')).toBeInTheDocument();
		expect(screen.getByText('2026-11-12')).toBeInTheDocument();
		expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
		expect(screen.queryByText('2026-12-31')).not.toBeInTheDocument();
		expect(screen.getAllByRole('listitem')).toHaveLength(originalTaskCount);
		expect(screen.queryByLabelText('Edit task name')).not.toBeInTheDocument();
		expect(updateTaskRequest).toHaveBeenCalledWith({
			id: '1',
			name: 'Updated task',
			due_date: '2026-11-12',
		});
	});

	test('sorts dated tasks by due date and puts undated tasks last', async () => {
		const user = userEvent.setup();
		render(<App />);
		await screen.findByText('Test Item 1');
		await user.selectOptions(screen.getByLabelText('Sort by'), 'due_date');
		const taskNames = screen.getAllByRole('listitem').map((row) => within(row).getByText(/Test Item|No date task/).textContent);
		expect(taskNames).toEqual(['Test Item 2', 'Test Item 1', 'No date task']);
	});

	test('shows an API error accessibly', async () => {
		server.use(rest.get('/api/items', (request, response, context) => response(context.status(500))));
		render(<App />);
		expect(await screen.findByRole('alert')).toHaveTextContent('Failed to fetch data');
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	test('shows an empty state when no tasks are returned', async () => {
		server.use(rest.get('/api/items', (request, response, context) => response(context.json([]))));
		render(<App />);
		expect(await screen.findByText('No tasks found. Add one to get started.')).toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		expect(screen.queryAllByRole('listitem')).toHaveLength(0);
	});
});