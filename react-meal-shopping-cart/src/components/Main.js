import { Col, Row, Typography } from "antd";
import Product from "./Product";

const { Title } = Typography;

export default function Main(props) {
  const { cartItems, products, onAdd, onRemove } = props;
  return (
    <Col span={16}>
      <Title level={2}>Products</Title>
      <Row gutter={[16, 16]}>
        {products.map((product) => (
          <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
            <Product
              product={product}
              item={cartItems.find((x) => x.id === product.id)}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          </Col>
        ))}
      </Row>
    </Col>
  );
}
