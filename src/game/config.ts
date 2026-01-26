export type TableConfig = {
  id: string;
  color: string;
  headerColor: string;
  subHeader: string;
};

export type ColumnType = 'down' | 'up' | 'free' | 'announc';

export type RowType = 'count' | 'manual' | 'straight' | 'full' | 'poker' | 'yamb';

export type RowConfig = {
  id: string;
  label: string;
  icon?: string;
  type?: RowType;
  isSum?: boolean;
};

export const tables: TableConfig[] = [
  { id: 't1', color: 'blue', headerColor: 'bg-blue-600', subHeader: 'bg-blue-50' },
  { id: 't2', color: 'emerald', headerColor: 'bg-emerald-600', subHeader: 'bg-emerald-50' }
];

export const columns: ColumnType[] = ['down', 'up', 'free', 'announc'];

export const rows: RowConfig[] = [
  { id: '1', label: '1', icon: 'fas fa-dice-one', type: 'count' },
  { id: '2', label: '2', icon: 'fas fa-dice-two', type: 'count' },
  { id: '3', label: '3', icon: 'fas fa-dice-three', type: 'count' },
  { id: '4', label: '4', icon: 'fas fa-dice-four', type: 'count' },
  { id: '5', label: '5', icon: 'fas fa-dice-five', type: 'count' },
  { id: '6', label: '6', icon: 'fas fa-dice-six', type: 'count' },
  { id: 'sum1', label: 'Sum 1', isSum: true },
  { id: 'max', label: 'Max', icon: 'fas fa-chevron-up', type: 'manual' },
  { id: 'min', label: 'Min', icon: 'fas fa-chevron-down', type: 'manual' },
  { id: 'sum2', label: 'Sum 2', isSum: true },
  { id: 'str', label: 'Straight', icon: 'fas fa-sort-numeric-down', type: 'straight' },
  { id: 'full', label: 'Full', icon: 'fas fa-home', type: 'full' },
  { id: 'poker', label: 'Poker', icon: 'fas fa-th-large', type: 'poker' },
  { id: 'yamb', label: 'Jamb', icon: 'fas fa-star', type: 'yamb' },
  { id: 'sum3', label: 'Sum 3', isSum: true }
];
