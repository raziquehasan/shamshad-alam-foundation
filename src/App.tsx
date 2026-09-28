import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public pages
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Members } from './pages/Members';
import { Work } from './pages/Work';
import { Impact } from './pages/Impact';
import { Transparency } from './pages/Transparency';
import { Activities } from './pages/Activities';
import { Gallery } from './pages/Gallery';
import { Donate } from './pages/Donate';
import { Contact } from './pages/Contact';

// Admin pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminDonations } from './pages/admin/AdminDonations';
import { AdminExpenses } from './pages/admin/AdminExpenses';
import { AdminBeneficiaries } from './pages/admin/AdminBeneficiaries';
import { AdminActivities } from './pages/admin/AdminActivities';
import { AdminGallery } from './pages/admin/AdminGallery';
import { AdminReports } from './pages/admin/AdminReports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="members" element={<Members />} />
            <Route path="work" element={<Work />} />
            <Route path="impact" element={<Impact />} />
            <Route path="transparency" element={<Transparency />} />
            <Route path="activities" element={<Activities />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="donate" element={<Donate />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="expenses" element={<AdminExpenses />} />
            <Route path="beneficiaries" element={<AdminBeneficiaries />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
