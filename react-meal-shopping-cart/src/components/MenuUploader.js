import React, { useState } from 'react';
import { uploadMenu } from './api';
import { Card, Upload, Button, Table, Typography, Alert, message } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Dragger } = Upload;

const MenuUploader = () => {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleBeforeUpload = (file) => {
    // Replace the file list with the new file (ensure single file mode)
    setFileList([file]);
    setError(null);
    setResult(null);
    return false; // Prevent automatic upload
  };

  const onRemove = () => {
    setFileList([]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please select a file first.");
      return;
    }

    const file = fileList[0];
    setLoading(true);
    setError(null);

    try {
      const response = await uploadMenu(file);
      setResult(response.data);
      message.success("Menu uploaded and processed successfully!");
    } catch (err) {
      console.error(err);
      let errorMsg = "Upload failed. Please try again.";
      if (err.response && err.response.status === 401) {
          errorMsg = "Unauthorized. Please login as a seller.";
      }
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!localStorage.getItem('token')) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Alert
            message="Access Denied"
            description="Please login as a seller to upload menus."
            type="warning"
            showIcon
          />
        </div>
      );
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '40%',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '20%',
      render: (text) => <span style={{ fontWeight: 'bold' }}>${text}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '40%',
      render: (text) => <span style={{ textTransform: 'capitalize' }}>{text}</span>,
    },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 0' }}>
      <Card 
        bordered={false} 
        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Title level={2} style={{ marginBottom: '0.5rem', color: '#7554a0' }}>Upload Menu</Title>
          <Typography.Text type="secondary" style={{ fontSize: '16px' }}>
            Upload your menu file (PDF, Image, or Text) to automatically extract items.
          </Typography.Text>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <Dragger 
            fileList={fileList}
            beforeUpload={handleBeforeUpload}
            onRemove={onRemove}
            accept=".pdf,image/*,text/plain"
            maxCount={1}
            style={{ padding: '2rem 0', background: '#fafafa', border: '2px dashed #d9d9d9', borderRadius: '8px' }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#7554a0' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: 500 }}>
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Supports single file upload. 
            </p>
          </Dragger>
        </div>

        <Button 
          type="primary" 
          onClick={handleUpload} 
          disabled={fileList.length === 0} 
          loading={loading}
          block
          size="large"
          icon={<UploadOutlined />}
          style={{ 
            height: '50px', 
            fontSize: '18px', 
            borderRadius: '6px',
            backgroundColor: fileList.length > 0 ? '#7554a0' : undefined,
            borderColor: fileList.length > 0 ? '#7554a0' : undefined
          }}
        >
          {loading ? "Processing..." : "Upload & Process Menu"}
        </Button>

        {error && (
          <div style={{ marginTop: '1.5rem' }}>
            <Alert 
              message="Upload Failed" 
              description={error} 
              type="error" 
              showIcon 
              closable
              onClose={() => setError(null)}
            />
          </div>
        )}

        {result && (
          <div style={{ marginTop: '2.5rem', animation: 'fadeIn 0.5s ease-in-out' }}>
             <Alert
                message="Processing Complete"
                description={`Successfully extracted ${result.items_processed} items from your menu.`}
                type="success"
                showIcon
                style={{ marginBottom: '2rem', border: '1px solid #b7eb8f', background: '#f6ffed' }}
             />
             
            {result.items && result.items.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                   <Title level={4} style={{ margin: 0, color: '#333' }}>Extracted Items</Title>
                </div>
                <Table 
                  dataSource={result.items} 
                  columns={columns} 
                  rowKey={(record, index) => index}
                  pagination={{ pageSize: 5 }} 
                  bordered
                  size="middle"
                  style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #f0f0f0' }}
                />
              </>
            )}
          </div>
        )}
      </Card>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MenuUploader;