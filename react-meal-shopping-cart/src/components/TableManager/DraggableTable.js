import React from 'react';
import { Rnd } from 'react-rnd';
import { Card } from 'antd';

const DraggableTable = ({ table, updateTable, onEdit }) => {
  const { id, x, y, width, height, label, seats, shape } = table;

  const style = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "solid 1px #ddd",
    background: "#f0f0f0",
    borderRadius: shape === 'circle' ? '50%' : '8px',
  };

  return (
    <Rnd
      size={{ width, height }}
      position={{ x, y }}
      onDragStop={(e, d) => {
        updateTable(id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updateTable(id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
      }}
      bounds="parent"
      style={style}
      onDoubleClick={onEdit}
    >
      <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none' }}>
        <strong>{label}</strong>
        <br />
        <small>{seats} Seats</small>
      </div>
    </Rnd>
  );
};

export default DraggableTable;