import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { plantDataApi, type ColumnInfo, type FormulaColumns } from '@/services/plantDataApi';
import { PlantDataTable } from '@/types/models';

interface FormulaBuilderProps {
  onSubmit: (formula: { name: string; expression: string; table: PlantDataTable }) => void;
  initialFormula?: {
    name: string;
    expression: string;
    table: PlantDataTable;
  };
}

export function FormulaBuilder({ onSubmit, initialFormula }: FormulaBuilderProps) {
  const [columns, setColumns] = useState<FormulaColumns>({ input_columns: [], calculated_columns: [] });
  const [selectedTable, setSelectedTable] = useState<PlantDataTable>(PlantDataTable.INPUT_RECORDS);
  const [formulaName, setFormulaName] = useState(initialFormula?.name || '');
  const [expression, setExpression] = useState(initialFormula?.expression || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadColumns();
  }, []);

  const loadColumns = async () => {
    try {
      const data = await plantDataApi.getFormulaColumns();
      setColumns(data);
    } catch (err) {
      setError('Failed to load columns');
      console.error(err);
    }
  };

  const handleColumnSelect = (column: ColumnInfo) => {
    setExpression(prev => {
      const newExpression = prev ? `${prev} ${column.name}` : column.name;
      return newExpression;
    });
  };

  const handleOperatorSelect = (operator: string) => {
    setExpression(prev => {
      const newExpression = prev ? `${prev} ${operator}` : operator;
      return newExpression;
    });
  };

  const handleSubmit = () => {
    if (!formulaName || !expression) {
      setError('Please fill in all fields');
      return;
    }

    onSubmit({
      name: formulaName,
      expression,
      table: selectedTable
    });
  };

  const availableColumns = selectedTable === PlantDataTable.INPUT_RECORDS
    ? columns.input_columns
    : columns.calculated_columns;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Formula</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Formula Name</label>
          <Input
            value={formulaName}
            onChange={(e) => setFormulaName(e.target.value)}
            placeholder="Enter formula name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Target Table</label>
          <Select
            value={selectedTable}
            onValueChange={(value) => setSelectedTable(value as PlantDataTable)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PlantDataTable.INPUT_RECORDS}>Input Records</SelectItem>
              <SelectItem value={PlantDataTable.CALCULATED_RECORDS}>Calculated Records</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Expression</label>
          <div className="flex gap-2">
            <Input
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Enter formula expression"
              readOnly
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setExpression('')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Available Columns</label>
          <div className="flex flex-wrap gap-2">
            {availableColumns.map((column) => (
              <Button
                key={column.name}
                variant="outline"
                size="sm"
                onClick={() => handleColumnSelect(column)}
              >
                {column.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Operators</label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOperatorSelect('+')}
            >
              +
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOperatorSelect('-')}
            >
              -
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOperatorSelect('*')}
            >
              ×
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOperatorSelect('/')}
            >
              ÷
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOperatorSelect('(')}
            >
              (
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOperatorSelect(')')}
            >
              )
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
        >
          Create Formula
        </Button>
      </CardContent>
    </Card>
  );
} 