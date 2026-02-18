import '@mui/material/Button';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    // Add custom semantic variants
    primary: true;
    secondary: true;
    ghost: true;
    floating: true;
  }
}
