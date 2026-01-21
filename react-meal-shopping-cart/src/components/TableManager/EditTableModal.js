import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Radio, Button } from 'antd';

const EditTableModal = ({ open, onCreate, onCancel, initialValues }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  return (
    <Modal
      open={open}
      title="Edit Table Details"
      okText="Save"
      cancelText="Cancel"
      onCancel={onCancel}
      footer={[
        <div key="footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button key="back" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              form
                .validateFields()
                .then((values) => {
                  form.resetFields();
                  onCreate(values);
                })
                .catch((info) => {
                  console.log('Validate Failed:', info);
                });
            }}
          >
            Save
          </Button>
        </div>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          shape: 'rect',
          seats: 2,
        }}
      >
        <Form.Item
          name="label"
          label="Label"
          rules={[
            {
              required: true,
              message: 'Please input the label of the table!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="seats"
          label="Number of Seats"
          rules={[
            {
              required: true,
              message: 'Please input the number of seats!',
            },
          ]}
        >
          <InputNumber min={1} max={20} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="shape"
          label="Table Shape"
          rules={[
            {
              required: true,
              message: 'Please select the shape of the table!',
            },
          ]}
        >
          <Radio.Group>
            <Radio value="rect">Rectangle/Square</Radio>
            <Radio value="circle">Circle</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditTableModal;