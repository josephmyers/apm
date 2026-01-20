import { ThemeProvider, createTheme } from '@mui/material';
import DataChanges from './hoc/DataChanges';
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
                  borderColor: '#d1d5db',
                  borderWidth: 1,
                  boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.14)',
                },
              },
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
