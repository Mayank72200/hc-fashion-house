import { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw, Search, Eye, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';

// Note: This is a placeholder for the Orders management page
// The actual orders API would need to be implemented in the backend

// Order status badge
function OrderStatusBadge({ status }) {
  const styles = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Truck },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  };

  const style = styles[status] || styles.pending;
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Simulate loading - replace with actual API call
    const timer = setTimeout(() => {
      // Placeholder data
      setOrders([
        {
          id: 'ORD-001',
          customer: 'John Doe',
          email: 'john@example.com',
          total: 299900, // in paise
          status: 'pending',
          items: 2,
          created_at: new Date().toISOString(),
        },
        {
          id: 'ORD-002',
          customer: 'Jane Smith',
          email: 'jane@example.com',
          total: 459900,
          status: 'processing',
          items: 3,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'ORD-003',
          customer: 'Mike Johnson',
          email: 'mike@example.com',
          total: 159900,
          status: 'shipped',
          items: 1,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !order.id.toLowerCase().includes(searchLower) &&
        !order.customer.toLowerCase().includes(searchLower) &&
        !order.email.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (statusFilter && order.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const formatPrice = (rupees) => `₹${rupees.toLocaleString('en-IN')}`;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">View and manage customer orders</p>
        </div>
        <button
          onClick={() => setLoading(true)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-sm font-medium text-muted-foreground">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium">{order.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{order.items} item(s)</td>
                    <td className="py-3 px-4 font-medium">{formatPrice(order.total)}</td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1.5 rounded hover:bg-muted" title="View Order">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-1">No orders found</h3>
            <p className="text-muted-foreground">
              {search || statusFilter
                ? 'Try adjusting your filters'
                : 'Orders will appear here when customers place them'}
            </p>
          </div>
        )}
      </div>

      {/* Info notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This is a preview of the Orders management interface. 
          Full order management functionality including status updates, order details, and 
          fulfillment tracking will be available once the orders API is fully implemented.
        </p>
      </div>
    </div>
  );
}
