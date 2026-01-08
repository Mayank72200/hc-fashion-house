import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminDashboardAPI, AdminProductAPI, AdminStockAPI } from '../../lib/adminApi';
import {
  Package,
  Folder,
  Grid,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

// Stat card component
function StatCard({ title, value, icon: Icon, color, link }) {
  const content = (
    <div className={`p-6 rounded-xl border bg-white dark:bg-gray-900 transition-shadow hover:shadow-md ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#C9A24D]/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-[#C9A24D]" />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}

// Quick action button
function QuickAction({ title, description, icon: Icon, href }) {
  return (
    <Link
      to={href}
      className="flex items-center gap-4 p-4 rounded-lg border bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-[#C9A24D]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-[#C9A24D]" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
    </Link>
  );
}

// Product row in recent products table
function ProductRow({ product }) {
  // Price is stored in rupees
  const price = product.price ? product.price.toFixed(0) : '0';
  
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900 dark:text-white">{product.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{product.color || 'No color'}</p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 text-sm text-gray-900 dark:text-white">₹{price}</td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            product.status === 'live'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : product.status === 'draft'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {product.status}
        </span>
      </td>
      <td className="py-3 text-right">
        <Link
          to={`/admin/products/${product.id}/edit`}
          className="text-sm text-[#C9A24D] hover:text-[#B8913C] hover:underline"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalCatalogues: 0,
    lowStockCount: 0,
    liveProducts: 0,
    draftProducts: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch stats
      const dashboardStats = await AdminDashboardAPI.getStats();
      setStats(dashboardStats);

      // Fetch recent products
      const recent = await AdminDashboardAPI.getRecentProducts(5);
      setRecentProducts(recent);

      // Fetch low stock products
      try {
        const lowStock = await AdminStockAPI.getLowStockProducts(5);
        setLowStockProducts(lowStock.slice(0, 5));
      } catch (e) {
        // Low stock might fail if no variants exist
        setLowStockProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-[#C9A24D]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome to HC Fashion House Admin</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color=""
          link="/admin/products"
        />
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          icon={Folder}
          color=""
          link="/admin/categories"
        />
        <StatCard
          title="Articles / Designs"
          value={stats.totalCatalogues}
          icon={Grid}
          color=""
          link="/admin/products"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color={stats.lowStockCount > 0 ? 'border-red-300 dark:border-red-800' : ''}
          link="/admin/stock"
        />
      </div>

      {/* Product status summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-800 dark:text-green-300">Live Products</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.liveProducts}</p>
        </div>
        <div className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium text-yellow-800 dark:text-yellow-300">Draft Products</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">{stats.draftProducts}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            title="Add New Product"
            description="Create a new product listing"
            icon={Plus}
            href="/admin/products/new"
          />
          <QuickAction
            title="Manage Categories"
            description="Organize product categories"
            icon={Folder}
            href="/admin/categories"
          />
          <QuickAction
            title="Update Stock"
            description="Manage inventory levels"
            icon={Package}
            href="/admin/stock"
          />
        </div>
      </div>

      {/* Recent products and low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent products */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Products</h2>
            <Link
              to="/admin/products"
              className="text-sm text-[#C9A24D] hover:text-[#B8913C] hover:underline"
            >
              View All
            </Link>
          </div>
          {recentProducts.length > 0 ? (
            <table className="w-full">
              <tbody>
                {recentProducts.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No products yet</p>
              <Link to="/admin/products/new" className="text-[#C9A24D] hover:underline text-sm">
                Add your first product
              </Link>
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h2>
            <Link
              to="/admin/stock"
              className="text-sm text-[#C9A24D] hover:text-[#B8913C] hover:underline"
            >
              Manage Stock
            </Link>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800"
                >
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-300">{product.name}</p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Only {product.totalStock} items left
                    </p>
                  </div>
                  <Link
                    to={`/admin/products/${product.id}/edit`}
                    className="text-sm text-red-700 dark:text-red-400 hover:underline"
                  >
                    Update
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No low stock alerts</p>
              <p className="text-sm">All products have sufficient stock</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
