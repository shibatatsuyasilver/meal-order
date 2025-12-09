import api from "./api";
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
    } catch (error) {
      console.error("Error sending order:", error);
    }
  };
  return (
    <aside className="block col-2">
      <h2>Cart Items</h2>
      <div>
        {cartItems.length === 0 && <div>Cart is empty</div>}
        {cartItems.map((item) => (
          <div key={item.id} className="row">
            <div className="col-1">{item.name}</div>
            <div className="col-1">
              <button onClick={() => onRemove(item)} className="remove">
                -
              </button>
              <button onClick={() => onAdd(item)} className="add">
                +
              </button>
            </div>
            <div className="col-1 text-right">
              {item.qty} x ${item.price.toFixed(2)}
            </div>
          </div>
        ))}
        {cartItems.length !== 0 && (
          <>
            <hr />
            <div className="row">
              <div className="col-2">Total Price</div>
              <div className="col-1">${itemPrice.toFixed(2)}</div>
            </div>
            <div>
              <button onClick={handleSubmit}>Checkout</button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
