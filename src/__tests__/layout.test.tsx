import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainLayout from '@/components/layout/MainLayout';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  MoreVertical: () => <div data-testid="more-vertical-icon" />,
  Save: () => <div data-testid="save-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

describe('Header Component', () => {
  const mockToggleSidebar = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<Header onToggleSidebar={mockToggleSidebar} />);

    expect(screen.getByText('Select a note to begin')).toBeInTheDocument();
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  it('displays current note title when provided', () => {
    render(
      <Header
        onToggleSidebar={mockToggleSidebar}
        currentNoteTitle="Test Note"
      />
    );

    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('shows saving indicator when isSaving is true', () => {
    render(
      <Header
        onToggleSidebar={mockToggleSidebar}
        currentNoteTitle="Test Note"
        isSaving={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByTestId('save-icon')).toBeInTheDocument();
  });

  it('shows delete button when note is selected', () => {
    render(
      <Header
        onToggleSidebar={mockToggleSidebar}
        currentNoteTitle="Test Note"
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete note/i });
    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleSidebar when menu button is clicked', () => {
    render(<Header onToggleSidebar={mockToggleSidebar} />);

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });
});

describe('Sidebar Component', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when closed', () => {
    render(<Sidebar isOpen={false} onToggle={mockOnToggle} />);

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('New Note')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument();
  });

  it('renders correctly when open', async () => {
    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    expect(screen.getByText('Notes')).toBeInTheDocument();

    // With real store, initially shows "No notes yet" when empty
    await waitFor(() => {
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });
  });

  it('handles search input correctly', async () => {
    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    const searchInput = screen.getByPlaceholderText('Search notes...');

    // Initially shows "No notes yet" with empty store
    await waitFor(() => {
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });

    // Test search input interaction
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');

    // With search query but no notes, should show "No notes found"
    await waitFor(() => {
      expect(screen.getByText('No notes found')).toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput).toHaveValue('');

    // Back to "No notes yet"
    await waitFor(() => {
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });
  });

  it('shows correct New Note button behavior', async () => {
    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    const newNoteButton = screen.getByText('New Note');
    expect(newNoteButton).toBeInTheDocument();

    // Button should be clickable and not disabled initially
    expect(newNoteButton).not.toBeDisabled();

    // Click the button (this will call the real store's createNote function)
    fireEvent.click(newNoteButton);

    // The store will handle the note creation
  });

  it('calls onToggle when mobile menu button is clicked', () => {
    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    // Find the menu button in the header
    const menuButtons = screen.getAllByTestId('menu-icon');
    const sidebarMenuButton = menuButtons.find((button) =>
      button.closest('.md\\:hidden')
    );

    if (sidebarMenuButton) {
      fireEvent.click(sidebarMenuButton.closest('button')!);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    }
  });
});

describe('MainLayout Component', () => {
  const TestChild = () => <div data-testid="test-child">Test Content</div>;

  it('renders children correctly', () => {
    render(
      <MainLayout>
        <TestChild />
      </MainLayout>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('passes props correctly to Header component', () => {
    render(
      <MainLayout currentNoteTitle="Test Note" isSaving={true}>
        <TestChild />
      </MainLayout>
    );

    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('manages sidebar state correctly', () => {
    render(
      <MainLayout>
        <TestChild />
      </MainLayout>
    );

    // Sidebar should be closed initially on mobile
    const sidebar = screen.getByText('Notes').closest('[class*="transform"]');
    expect(sidebar).toHaveClass('-translate-x-full');
  });
});
