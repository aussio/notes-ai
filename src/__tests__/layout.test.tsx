import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainLayout from '@/components/layout/MainLayout';

// Mock auth store
jest.mock('@/store/authStore', () => ({
  useUser: jest.fn(() => ({
    id: 'test-user',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
    },
  })),
  useAuthStore: {
    getState: () => ({
      user: {
        id: 'test-user',
        email: 'test@example.com',
      },
    }),
  },
}));

// Mock notes and notecards stores
const mockSetSearchQuery = jest.fn();
const mockCreateNote = jest.fn();
const mockCreateNotecard = jest.fn();

jest.mock('@/store/notesStore', () => ({
  useNotesStore: () => ({
    notes: [],
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
    createNote: mockCreateNote,
    setCurrentNote: jest.fn(),
    currentNote: null,
    isLoading: false,
    error: null,
  }),
  useFilteredNotes: () => [],
}));

jest.mock('@/store/notecardsStore', () => ({
  useNotecardsStore: () => ({
    notecards: [],
    searchQuery: '',
    setSearchQuery: jest.fn(),
    createNotecard: mockCreateNotecard,
    setCurrentNotecard: jest.fn(),
    currentNotecard: null,
    isLoading: false,
    error: null,
    deleteNotecard: jest.fn(),
  }),
  useFilteredNotecards: () => [],
}));

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  const MockedImage = ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    return (
      <div
        data-testid="mocked-image"
        data-src={src}
        data-alt={alt}
        {...props}
      />
    );
  };
  MockedImage.displayName = 'Image';
  return MockedImage;
});

// Mock theme hook for ThemeToggle
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    toggleTheme: jest.fn(),
  }),
}));

// Mock editor utils
jest.mock('@/lib/editor', () => ({
  serializeToPlainText: jest.fn(() => 'Mock content'),
  findNotesWithNotecardEmbeds: jest.fn(() => []),
}));

// Mock the DeleteNotecardModal component
jest.mock('@/components/notecards/DeleteNotecardModal', () => ({
  DeleteNotecardModal: ({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div data-testid="delete-modal">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Delete</button>
      </div>
    ) : null,
}));

describe('Header Component', () => {
  const mockToggleSidebar = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<Header onToggleSidebar={mockToggleSidebar} />);

    expect(screen.getByText('Untitled')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /toggle sidebar/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
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
    // Look for the saving indicator - the animate-pulse class is on the SVG element
    const savingContainer = screen.getByText('Saving...').closest('div');
    const animatedIcon = savingContainer?.querySelector('.animate-pulse');
    expect(animatedIcon).toBeInTheDocument();
  });

  it('shows delete button when note is selected', () => {
    render(
      <Header
        onToggleSidebar={mockToggleSidebar}
        currentNoteTitle="Test Note"
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', {
      name: /delete current item/i,
    });
    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleSidebar when menu button is clicked', () => {
    render(<Header onToggleSidebar={mockToggleSidebar} />);

    const menuButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(menuButton);

    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });
});

describe('Sidebar Component', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetSearchQuery.mockClear();
    mockCreateNote.mockClear();
    mockCreateNotecard.mockClear();
  });

  it('renders correctly when closed', () => {
    render(<Sidebar isOpen={false} onToggle={mockOnToggle} />);

    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByText('New Note')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument();
  });

  it('renders correctly when open', async () => {
    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();

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

    // Verify the mock function was called (don't care about call count)
    expect(mockSetSearchQuery).toHaveBeenCalled();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(mockSetSearchQuery).toHaveBeenCalled();
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

    // Find the close sidebar button
    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    fireEvent.click(closeButton);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
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
    const sidebar = screen
      .getByRole('heading', { name: 'Notes' })
      .closest('[class*="transform"]');
    expect(sidebar).toHaveClass('-translate-x-full');
  });
});
