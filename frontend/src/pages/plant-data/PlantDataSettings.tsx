import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, RefreshCw, RotateCcw } from 'lucide-react';
import { plantDataApi } from '@/services/plantDataApi';
import { FormulaBuilder } from '@/components/plant-data/FormulaBuilder';
import type { Formula, CustomColumn } from '@/types/models';
import type { FormulaVariable } from '@/services/plantDataApi';
import { PlantDataTable } from '@/types/models';
import toast from '@/utils/toast';

export default function PlantDataSettings() {
    const [formulas, setFormulas] = useState<Formula[]>([]);
    const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
    const [formulaVariables, setFormulaVariables] = useState<FormulaVariable[]>([]);
    const [loading, setLoading] = useState(true);

    // New column state
    const [newColumn, setNewColumn] = useState<Partial<CustomColumn>>({
        name: '',
        label: '',
        type: 'text',
        is_required: false,
        table: PlantDataTable.INPUT_RECORDS
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [formulasData, columnsData, variablesData] = await Promise.all([
                plantDataApi.getFormulas(),
                plantDataApi.getCustomColumns(),
                plantDataApi.getFormulaVariables()
            ]);
            setFormulas(formulasData);
            setCustomColumns(columnsData);
            setFormulaVariables(variablesData);
        } catch (err) {
            console.error('Failed to load data:', err);
            toast.error('Failed to load settings data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFormula = async (formula: { name: string; expression: string; table: PlantDataTable }) => {
        try {
            const newFormula = await plantDataApi.createFormula(formula);
            setFormulas(prev => [...prev, newFormula]);
            toast.success('Formula created successfully');
        } catch (err) {
            console.error('Error creating formula:', err);
            toast.error('Failed to create formula');
        }
    };

    const handleDeleteFormula = async (id: number) => {
        try {
            await plantDataApi.deleteFormula(id);
            setFormulas(prev => prev.filter(f => f.id !== id));
            toast.success('Formula deleted successfully');
        } catch (err) {
            console.error('Error deleting formula:', err);
            toast.error('Failed to delete formula');
        }
    };

    const handleCreateColumn = async () => {
        // Validate required fields
        if (!newColumn.name || !newColumn.label) {
            toast.error('Name and label are required fields');
            return;
        }

        // Validate name format (lowercase, no spaces, no special chars)
        if (!/^[a-z0-9_]+$/.test(newColumn.name!)) {
            toast.error('Name must be lowercase and contain only letters, numbers, and underscores');
            return;
        }

        try {
            const column = await plantDataApi.createCustomColumn(newColumn);
            setCustomColumns(prev => [...prev, column]);
            setNewColumn({
                name: '',
                label: '',
                type: 'text',
                is_required: false,
                table: PlantDataTable.INPUT_RECORDS
            });
            toast.success('Column created successfully');
        } catch (err) {
            console.error('Error creating column:', err);
            toast.error('Failed to create column');
        }
    };

    const handleDeleteColumn = async (id: number) => {
        try {
            await plantDataApi.deleteCustomColumn(id);
            setCustomColumns(prev => prev.filter(c => c.id !== id));
            toast.success('Column deleted successfully');
        } catch (err) {
            console.error('Error deleting column:', err);
            toast.error('Failed to delete column');
        }
    };

    const handleUpdateVariable = async (id: number, value: number) => {
        try {
            const updatedVariable = await plantDataApi.updateFormulaVariable(id, value);
            setFormulaVariables(prev => 
                prev.map(v => v.id === id ? updatedVariable : v)
            );
            toast.success('Variable updated successfully');
        } catch (err) {
            console.error('Error updating variable:', err);
            toast.error('Failed to update variable');
        }
    };

    const handleResetVariable = async (id: number) => {
        try {
            const resetVariable = await plantDataApi.resetFormulaVariable(id);
            setFormulaVariables(prev => 
                prev.map(v => v.id === id ? resetVariable : v)
            );
            toast.success('Variable reset to default value');
        } catch (err) {
            console.error('Error resetting variable:', err);
            toast.error('Failed to reset variable');
        }
    };

    const handleResetAllVariables = async () => {
        try {
            await plantDataApi.resetAllFormulaVariables();
            loadData(); // Reload all data to get the updated variables
            toast.success('All variables reset to default values');
        } catch (err) {
            console.error('Error resetting all variables:', err);
            toast.error('Failed to reset all variables');
        }
    };

    return (
        <div className="container py-6">
            <h1 className="text-2xl font-bold mb-6">Plant Data Settings</h1>

            <Tabs defaultValue="formulas">
                <TabsList className="mb-4">
                    <TabsTrigger value="formulas">Formulas</TabsTrigger>
                    <TabsTrigger value="columns">Custom Columns</TabsTrigger>
                    <TabsTrigger value="variables">Formula Variables</TabsTrigger>
                </TabsList>

                <TabsContent value="formulas">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Formula</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormulaBuilder onSubmit={handleCreateFormula} />
                        </CardContent>
                    </Card>

                    <h2 className="font-semibold text-lg mt-6 mb-3">Existing Formulas</h2>
                    {loading ? (
                        <p>Loading formulas...</p>
                    ) : formulas.length === 0 ? (
                        <p>No formulas created yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {formulas.map(formula => (
                                <Card key={formula.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">{formula.name}</CardTitle>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleDeleteFormula(formula.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-500 mb-2">
                                            <span className="font-medium">Table:</span> {formula.table}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            <span className="font-medium">Expression:</span> {formula.expression}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="columns">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Custom Column</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <Label htmlFor="name">Name (system name)</Label>
                                    <Input 
                                        id="name" 
                                        value={newColumn.name} 
                                        onChange={e => setNewColumn({...newColumn, name: e.target.value})} 
                                        placeholder="e.g. custom_field" 
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Lowercase, no spaces, use underscores
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="label">Label (display name)</Label>
                                    <Input 
                                        id="label" 
                                        value={newColumn.label} 
                                        onChange={e => setNewColumn({...newColumn, label: e.target.value})} 
                                        placeholder="e.g. Custom Field" 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="type">Type</Label>
                                    <select 
                                        id="type" 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                                        value={newColumn.type} 
                                        onChange={e => setNewColumn({...newColumn, type: e.target.value as 'text' | 'number' | 'date'})}
                                    >
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="date">Date</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="table">Table</Label>
                                    <select 
                                        id="table" 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                                        value={newColumn.table} 
                                        onChange={e => setNewColumn({...newColumn, table: e.target.value as PlantDataTable})}
                                    >
                                        <option value={PlantDataTable.INPUT_RECORDS}>Input Records</option>
                                        <option value={PlantDataTable.CALCULATED_RECORDS}>Calculated Records</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                                <input 
                                    type="checkbox" 
                                    id="is_required" 
                                    checked={newColumn.is_required || false} 
                                    onChange={e => setNewColumn({...newColumn, is_required: e.target.checked})} 
                                />
                                <Label htmlFor="is_required">Required</Label>
                            </div>
                            <Button onClick={handleCreateColumn}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Column
                            </Button>
                        </CardContent>
                    </Card>

                    <h2 className="font-semibold text-lg mt-6 mb-3">Existing Custom Columns</h2>
                    {loading ? (
                        <p>Loading columns...</p>
                    ) : customColumns.length === 0 ? (
                        <p>No custom columns created yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customColumns.map(column => (
                                <Card key={column.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">{column.label}</CardTitle>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleDeleteColumn(column.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-500 mb-2">
                                            <span className="font-medium">System Name:</span> {column.name}
                                        </p>
                                        <p className="text-sm text-slate-500 mb-2">
                                            <span className="font-medium">Type:</span> {column.type}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            <span className="font-medium">Table:</span> {column.table}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="variables">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Formula Variables</CardTitle>
                                <Button 
                                    onClick={handleResetAllVariables} 
                                    variant="outline" 
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Reset All to Default
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p>Loading variables...</p>
                            ) : formulaVariables.length === 0 ? (
                                <p>No formula variables found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {formulaVariables.map(variable => (
                                        <div key={variable.id} className="p-4 border rounded-lg">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-medium text-lg">{variable.display_name}</h3>
                                                    <p className="text-sm text-slate-500">{variable.description}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center gap-1"
                                                    onClick={() => handleResetVariable(variable.id)}
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                    Reset
                                                </Button>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <div className="flex-1">
                                                    <Label htmlFor={`var-${variable.id}`}>Value</Label>
                                                    <div className="flex gap-2 mt-1">
                                                        <Input
                                                            id={`var-${variable.id}`}
                                                            type="number"
                                                            step="0.01"
                                                            value={variable.value}
                                                            onChange={e => {
                                                                const newValue = parseFloat(e.target.value);
                                                                if (!isNaN(newValue)) {
                                                                    setFormulaVariables(prev =>
                                                                        prev.map(v => v.id === variable.id ? {...v, value: newValue} : v)
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <Button 
                                                            onClick={() => handleUpdateVariable(variable.id, variable.value)}
                                                        >
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Default Value</Label>
                                                    <div className="mt-1 h-10 px-4 py-2 bg-slate-100 rounded-md flex items-center text-slate-600">
                                                        {variable.default_value}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 