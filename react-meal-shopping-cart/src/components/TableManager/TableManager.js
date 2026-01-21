import React, { useState, useEffect } from 'react';
import { Button, Layout, theme, FloatButton } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import DraggableTable from './DraggableTable';
import EditTableModal from './EditTableModal';
import { Card } from 'antd';

const { Content } = Layout;

const TableManager = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [tables, setTables] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [paletteVisible, setPaletteVisible] = useState(false);

  // Mock initial data fetch
  useEffect(() => {
    // In a real app, fetch from API here
    const initialTables = [
      { id: 1, label: 'T1', x: 50, y: 50, width: 100, height: 100, seats: 4, shape: 'rect' },
      { id: 2, label: 'T2', x: 200, y: 50, width: 80, height: 80, seats: 2, shape: 'circle' },
    ];
    setTables(initialTables);
  }, []);

  const addTable = (shape = 'rect', x = 50, y = 50) => {
    const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const newTable = {
      id: newId,
      label: `T${newId}`,
      x,
      y,
      width: 80,
      height: 80,
      seats: 2,
      shape,
    };
    setTables([...tables, newTable]);
  };

  const updateTable = (id, newProps) => {
    setTables(tables.map(table =>
      table.id === id ? { ...table, ...newProps } : table
    ));
  };

  const onEditTable = (table) => {
    setEditingTable(table);
    setModalOpen(true);
  };

  const handleSaveTable = (values) => {
    if (editingTable) {
      updateTable(editingTable.id, values);
    }
    setModalOpen(false);
    setEditingTable(null);
  };

  const saveLayout = () => {
    console.log('Saving layout:', tables);
    // Call API to save layout
    alert('Layout saved (check console)');
  };

  const handleDragStart = (e, shape) => {
    e.dataTransfer.setData('shape', shape);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const shape = e.dataTransfer.getData('shape');
    if (!shape) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    // Center the new table on cursor (assuming 80x80 size)
    const x = e.clientX - canvasRect.left - 40;
    const y = e.clientY - canvasRect.top - 40;

    addTable(shape, x, y);
    setPaletteVisible(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const totalSeats = tables.reduce((sum, table) => sum + table.seats, 0);

  return (
    <Layout style={{ height: '100%', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '24px' }}>
        <div
          style={{
            background: colorBgContainer,
            minHeight: '100%',
            padding: 24,
            borderRadius: borderRadiusLG,
            position: 'relative',
            overflow: 'hidden', // Contain draggable elements
            height: '80vh',     // Fixed height for canvas area
            border: '2px dashed #d9d9d9',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Table Management</h2>
            <h3>Total Seats: {totalSeats}</h3>
          </div>
          <p>Drag and resize tables to arrange your floor plan. Double click to edit.</p>
          
          {tables.map(table => (
            <DraggableTable
              key={table.id}
              table={table}
              updateTable={updateTable}
              onEdit={() => onEditTable(table)}
            />
          ))}

          <EditTableModal
            open={modalOpen}
            onCreate={handleSaveTable}
            onCancel={() => {
              setModalOpen(false);
              setEditingTable(null);
            }}
            initialValues={editingTable}
          />

          {paletteVisible && (
            <Card
              title="Drag a table"
              size="small"
              extra={<CloseOutlined onClick={() => setPaletteVisible(false)} />}
              style={{
                position: 'absolute',
                right: 80,
                bottom: 80,
                width: 200,
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'rect')}
                  style={{
                    width: 60,
                    height: 60,
                    border: '1px solid #ccc',
                    background: '#f0f0f0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab'
                  }}
                >
                  Square
                </div>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'circle')}
                  style={{
                    width: 60,
                    height: 60,
                    border: '1px solid #ccc',
                    background: '#f0f0f0',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab'
                  }}
                >
                  Circle
                </div>
              </div>
            </Card>
          )}

          <FloatButton.Group shape="circle" style={{ right: 24, bottom: 24 }}>
            <FloatButton
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setPaletteVisible(!paletteVisible)}
              tooltip="Add Table"
            />
            <FloatButton icon={<SaveOutlined />} onClick={saveLayout} tooltip="Save Layout" />
          </FloatButton.Group>
        </div>
      </Content>
    </Layout>
  );
};

export default TableManager;