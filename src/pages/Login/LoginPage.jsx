import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldAlert, Siren, Truck, Users } from 'lucide-react';
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

// One-click fill for the seeded demo accounts. Shown only in development builds.
const DEMO_PASSWORD = 'Password@123';
const DEMO_ACCOUNTS = [
  { label: 'Administrator', email: 'admin@drrc.local' },
  { label: 'Operator', email: 'operator@drrc.local' },
  { label: 'Team Lead', email: 'teamlead@drrc.local' },
  { label: 'Relief Coordinator', email: 'coordinator@drrc.local' },
];

const FEATURES = [
  { icon: Siren, text: 'Live incident tracking by severity and status' },
  { icon: Users, text: 'Assign teams, shelters and supplies to requests' },
  { icon: Truck, text: 'Dispatch tracking from departure to completion' },
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
          <span className="login-hero__logo">
            <ShieldAlert size={24} />
          </span>
          <strong>DRRC</strong>
        </div>

        <div>
          <h1>Coordinate every emergency response.</h1>
          <p className="login-hero__lead">Track incidents, requests, teams, shelters and relief supplies in one calm, organised control room.</p>
          <ul className="login-hero__points">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="login-hero__tile">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <span className="login-hero__foot">{APP_FULL_NAME}</span>
      </section>

      <section className="login-form-wrap">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h2>Sign in</h2>
          <p className="login-card__sub">Welcome back. Enter your account details.</p>

          {formError && (
            <div className="alert alert-danger py-2" role="alert">
              {formError}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
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
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={values.password}
                onChange={(e) => update('password', e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
          </div>

          <button type="submit" className="btn btn-submit" disabled={submitting}>
            {submitting && <Spinner size="sm" />} Sign in
          </button>

          {import.meta.env.DEV && (
            <>
              <hr className="login-divider" />
              <div className="demo-accounts">
                <span className="demo-accounts__title">Demo accounts — click to fill</span>
                <div className="demo-accounts__chips">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      className="demo-chip"
                      onClick={() => {
                        setValues({ email: acc.email, password: DEMO_PASSWORD });
                        setErrors({});
                        setFormError('');
                      }}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <p className="login-card__alt">
            New to the control room? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
