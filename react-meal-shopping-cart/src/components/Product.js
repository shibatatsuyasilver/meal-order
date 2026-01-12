import { Card, Button, Typography, Space } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Meta } = Card;
const { Text } = Typography;

export default function Product(props) {
  const { item, product, onAdd, onRemove } = props;
  return (
    <Card
      hoverable
      cover={<img alt={product.name} src={product.image} style={{ height: 200, objectFit: 'cover' }} />}
      actions={[
        item ? (
          <Space>
            <Button
              icon={<MinusOutlined />}
              onClick={() => onRemove(item)}
              size="small"
            />
            <Text strong>{item.qty}</Text>
            <Button
              icon={<PlusOutlined />}
              onClick={() => onAdd(item)}
              size="small"
              type="primary"
              style={{ backgroundColor: '#7554a0', borderColor: '#7554a0' }}
            />
          </Space>
        ) : (
          <Button
            type="primary"
            onClick={() => onAdd(product)}
            style={{ backgroundColor: '#7554a0', borderColor: '#7554a0', width: '80%' }}
          >
            Add To Cart
          </Button>
        )
      ]}
    >
      <Meta
        title={product.name}
        description={<Text strong>${product.price}</Text>}
      />
    </Card>
  );
}
