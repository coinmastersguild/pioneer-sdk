declare module '@saas-ui-pro/react' {
  import { TableState } from '@tanstack/react-table';

  interface CellSelectionTableState extends Partial<TableState> {
    cellSelection: {
      selectedCells: any[];
    };
  }

  interface TableFeature<T> {
    getInitialState?: (state?: any) => Partial<TableState>;
    [key: string]: any;
  }
} 