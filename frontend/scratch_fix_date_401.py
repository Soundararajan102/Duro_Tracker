import os
import re

path = r"d:\Duro Tracker\frontend\src\screens\admin\SettingsScreen.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace imports to include FileSystem, Sharing, and api components
if "import * as FileSystem" not in content:
    content = content.replace(
        "import * as WebBrowser from 'expo-web-browser';",
        "import * as FileSystem from 'expo-file-system';\nimport * as Sharing from 'expo-sharing';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\nimport { api, API_BASE_URL } from '../../services/api';"
    )

# Replace the download logic
old_handle_gen = """  const handleGenerateReport = async () => {
    if (reportTypes.includes('Purchase')) {
      const providerStr = selectedProviders.length > 0 ? selectedProviders.join(',') : undefined;
      const url = adminReportsApi.getPurchasePdfUrl(dateMode, startDate, endDate, providerStr);
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    }
  };"""

new_handle_gen = """  const handleGenerateReport = async () => {
    if (reportTypes.includes('Purchase')) {
      try {
        const providerStr = selectedProviders.length > 0 ? selectedProviders.join(',') : undefined;
        const params = new URLSearchParams();
        params.append('date_mode', dateMode);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (providerStr) params.append('provider_ids', providerStr);
        
        const urlSuffix = `/admin/reports/purchases/pdf?${params.toString()}`;
        
        if (Platform.OS === 'web') {
          // Download via axios to attach interceptor token automatically
          const response = await api.get(urlSuffix, { responseType: 'blob' });
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `Purchase_Report_${Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
        } else {
          // Native download with token
          const token = await AsyncStorage.getItem('@auth_token');
          const uri = `${API_BASE_URL}${urlSuffix}`;
          const fileUri = `${FileSystem.documentDirectory}Purchase_Report_${Date.now()}.pdf`;
          const result = await FileSystem.downloadAsync(uri, fileUri, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(result.uri);
          }
        }
      } catch (error) {
        console.error('Download failed', error);
      }
    }
  };"""

content = content.replace(old_handle_gen, new_handle_gen)

# Add DatePicker component logic inside SettingsScreen
# Wait, it's easier to just inline it with createElement if Web
inline_date_picker = """
const renderDatePicker = (value: string, onChange: (val: string) => void, placeholder: string) => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
          style={{ outline: 'none' }}
        />
      );
    }
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
      />
    );
  };
"""

# Inject renderDatePicker right after selectedProviders state
if "renderDatePicker" not in content:
    content = content.replace(
        "const { data: providers = [] } = useProviders();",
        "const { data: providers = [] } = useProviders();\n" + inline_date_picker
    )

# Replace the Date Inputs with renderDatePicker
old_start_date_input = """                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-07-17"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                  />"""

new_start_date_input = """                  {renderDatePicker(startDate, setStartDate, "2026-07-17")}"""
content = content.replace(old_start_date_input, new_start_date_input)

old_end_date_input = """                    <TextInput
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="2026-07-18"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                    />"""

new_end_date_input = """                    {renderDatePicker(endDate, setEndDate, "2026-07-18")}"""
content = content.replace(old_end_date_input, new_end_date_input)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SettingsScreen.tsx")
