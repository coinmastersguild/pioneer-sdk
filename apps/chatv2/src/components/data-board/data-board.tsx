import React, { createContext, useContext } from 'react';

export interface DataBoardProps {
  columns: any;
  data: any;
  groupBy: string;
  initialState?: any;
  state?: any;
  noResults?: React.ReactNode;
  getRowId: (row: any) => string | number;
  renderHeader: (header: any) => React.ReactNode;
  renderCard: (row: any) => React.ReactNode;
  px?: string | number;
  height?: string | number;
  onCardDragEnd?: (args: { items: any; to: any; from: any }) => void;
}

export interface DataBoardContextValue {
  getState: () => { columnVisibility: any; grouping: any[] };
}

const DataBoardContext = createContext<DataBoardContextValue | undefined>(undefined);

export function useDataBoardContext(): DataBoardContextValue {
  const context = useContext(DataBoardContext);
  if (!context) {
    throw new Error("useDataBoardContext must be used within a DataBoard component");
  }
  return context;
}

export const DataBoard: React.FC<DataBoardProps> = (props) => {
  const { data, getRowId, renderHeader, renderCard, state, initialState } = props;

  const stateValue = state || initialState || { columnVisibility: {}, grouping: [] };

  return (
    <DataBoardContext.Provider value={{ getState: () => stateValue }}>
      <div>
        {data && data.map((row: any) => (
          <div key={getRowId(row)}>
            <div>{renderHeader({ row })}</div>
            <div>{renderCard({ original: row })}</div>
          </div>
        ))}
      </div>
    </DataBoardContext.Provider>
  );
}; 