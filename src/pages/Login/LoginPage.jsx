import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import Spinner from '../../components/common/Spinner';
import { APP_FULL_NAME, ROLE_HOME, ROLE_LABELS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/formatters';
import { validateFields } from '../../utils/validators';

const FIELDS = [
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'password', label: 'Password', type: 'password', required: true, minLength: 6 },
];

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;

  const update = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateFields(FIELDS, values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;
    setSubmitting(true);
    try {
      const loggedIn = await login(values.email.trim(), values.password);
      toast.success(`Signed in as ${ROLE_LABELS[loggedIn.role]}`, `Welcome, ${loggedIn.name}`);
      const from = location.state?.from?.pathname;
      navigate(from && from !== '/' ? from : ROLE_HOME[loggedIn.role] || '/dashboard', { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to sign in'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-hero__brand">
          <span className="sidebar__logo">
            <ShieldAlert size={26} />
          </span>
          <strong>DRRC</strong>
        </div>
        <div>
          <h1>{APP_FULL_NAME}</h1>
          <p>
            One control room for incidents, emergency requests, response teams, shelters, relief supplies and dispatch — coordinated in real
            time.
          </p>
          <ul className="login-hero__points">
            <li><span className="dot dot--danger" /> Track active emergencies by severity</li>
            <li><span className="dot dot--warning" /> Prioritise and assign emergency requests</li>
            <li><span className="dot dot--success" /> Allocate and dispatch resources to completion</li>
          </ul>
        </div>
        <small>Authorised emergency personnel only. All actions are logged.</small>
      </section>

      <section className="login-form-wrap">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h2>Sign in</h2>
          <p className="text-muted">Use your control room credentials.</p>

          {formError && (
            <div className="alert alert-danger py-2" role="alert">
              {formError}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
              autoComplete="username"
              placeholder="name@agency.gov"
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group has-validation">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={values.password}
                onChange={(e) => update('password', e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : <LogIn size={18} />} Sign in
          </button>

          <p className="text-center small text-muted mt-3 mb-0">
            New to the control room? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
