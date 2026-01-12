import { Button, List, Typography, Divider, Col, message, Card, Space } from "antd";
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import api from "./api";

const { Title, Text } = Typography;

export default function Basket(props) {
  const { cartItems, onAdd, onRemove } = props;
  const itemPrice = cartItems.reduce((a, c) => a + c.qty * c.price, 0);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, "0");
      var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      var yyyy = today.getFullYear();

      today = mm + "/" + dd + "/" + yyyy;
      for (let i = 0; i < cartItems.length; i++) {
        var temp = {};
        temp["id"] = cartItems[i].id;
        temp["amount"] = cartItems[i].qty;
        temp["date"] = today;
        temp["category"] = cartItems[i].name;
        console.log(temp);
        await api.post("/transcations/", temp);
      }
      message.success('Order placed successfully!');
    } catch (error) {
      console.error("Error sending order:", error);
      message.error('Failed to place order.');
    }
  };

  return (
    <Col span={8}>
      <Card title={<Title level={3} style={{margin: 0}}>Cart Items</Title>} className="cart-card">
        {cartItems.length === 0 && <Text>Cart is empty</Text>}
        <List
          itemLayout="horizontal"
          dataSource={cartItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Space>
                    <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => onRemove(item)}
                    />
                    <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => onAdd(item)}
                        type="primary"
                        style={{ backgroundColor: '#7554a0', borderColor: '#7554a0' }}
                    />
                </Space>
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={`${item.qty} x $${item.price.toFixed(2)}`}
              />
              <div style={{ marginLeft: '10px' }}>
                  ${(item.qty * item.price).toFixed(2)}
              </div>
            </List.Item>
          )}
        />
        {cartItems.length !== 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text strong>Total Price</Text>
              <Text strong>${itemPrice.toFixed(2)}</Text>
            </div>
            <Button
                type="primary"
                block
                size="large"
                onClick={handleSubmit}
                style={{ backgroundColor: '#7554a0', borderColor: '#7554a0' }}
            >
              Checkout
            </Button>
          </>
        )}
      </Card>
    </Col>
  );
}
