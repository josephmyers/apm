import { ThemeProvider, createTheme } from '@mui/material';
import DataChanges from './hoc/DataChanges';

declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    neutral: true;
  }
  interface IconButtonOwnProps {
    variant?: 'floating';
  }
}
import { UnsavedProvider } from './context/UnsavedContext';
import SnackBarProvider from './hoc/SnackBar';
import { HotKeyProvider } from './context/HotKeyContext';
import routes from './routes/NavRoutes';
import { useSelector, shallowEqual } from 'react-redux';
import { IState } from './model';
import { getDataGridLocale } from './utils/dataGridLocale';
import { useMemo } from 'react';
export const HeadHeight = 64;

function App(): React.JSX.Element {
  const lang = useSelector((state: IState) => state.strings.lang, shallowEqual);

  const theme = useMemo(
    () =>
      createTheme(
        {
          palette: {
            primary: {
              main: '#135CB9', //Original: 135CB9, Better color: 1D9F90
            },
            secondary: {
              main: '#00A7E1', //Original: 00A7E1, Better color: 25CBB8
            },
            neutral: {
              main: '#000000',
            },
            // Custom colors - simple key-value pairs
            custom: {
              currentRegion: 'rgb(102, 255, 0, .5)',
            },
          } as any,
          typography: {
            button: {
              textTransform: 'capitalize',
            },
          },
          components: {
            MuiButton: {
              styleOverrides: {
                root: {
                  borderRadius: '8px',
                  padding: '8px 16px',
                  boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.12)',
                  fontSize: '1rem',
                  color: 'black',
                  background: '#f0f0f0',
                  '&:hover': {
                    background: '#e2e2e2',
                  },
                },
              },
              variants: [
                {
                  props: { variant: 'primary' },
                  style: {
                    background: '#333',
                    color: '#fff',
                    '&:hover': {
                      background: '#555',
                    },
                    '&:disabled': {
                      background: '#e0e0e0',
                      color: '#999',
                    },
                  },
                },
              ],
            },
            MuiIconButton: {
              variants: [
                {
                  props: { variant: 'floating' },
                  style: {
                    width: 56,
                    height: 56,
                    border: '1px solid',
                    borderColor: '#e0e0e0',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                    color: 'rgba(0, 0, 0, 0.5)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.2)',
                    },
                  },
                },
              ],
            },
          },
        },
        getDataGridLocale(lang)
      ),
    [lang]
  );

  return (
    <UnsavedProvider>
      <DataChanges>
        <SnackBarProvider>
          <HotKeyProvider>
            <ThemeProvider theme={theme}>{routes}</ThemeProvider>
          </HotKeyProvider>
        </SnackBarProvider>
      </DataChanges>
    </UnsavedProvider>
  );
}

export default App;
