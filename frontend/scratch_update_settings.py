import os

path = r"d:\Duro Tracker\frontend\src\screens\admin\SettingsScreen.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace imports
if "import { useProviders } from" not in content:
    content = content.replace(
        "import { useDrivers, useToggleDriver, useCreateDriver, useOrganization } from '../../hooks/useDrivers';",
        "import { useDrivers, useToggleDriver, useCreateDriver, useOrganization } from '../../hooks/useDrivers';\nimport { useProviders } from '../../hooks/usePurchases';\nimport { adminReportsApi } from '../../services/api';\nimport * as WebBrowser from 'expo-web-browser';\nimport { Platform } from 'react-native';"
    )

# Add state variables inside SettingsScreen
state_vars = """
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [reportTypes, setReportTypes] = React.useState<string[]>(['Purchase']);
  const [dateMode, setDateMode] = React.useState('single');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedProviders, setSelectedProviders] = React.useState<string[]>([]);
  const { data: providers = [] } = useProviders();

  const handleGenerateReport = async () => {
    if (reportTypes.includes('Purchase')) {
      const providerStr = selectedProviders.length > 0 ? selectedProviders.join(',') : undefined;
      const url = adminReportsApi.getPurchasePdfUrl(dateMode, startDate, endDate, providerStr);
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    }
  };

  const toggleReportType = (type: string) => {
    if (type !== 'Purchase') return; // only purchase enabled for now
    if (reportTypes.includes(type)) {
      setReportTypes(reportTypes.filter(t => t !== type));
    } else {
      setReportTypes([...reportTypes, type]);
    }
  };

  const toggleProvider = (id: string) => {
    if (selectedProviders.includes(id)) {
      setSelectedProviders(selectedProviders.filter(p => p !== id));
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };
"""

if "isReportModalOpen" not in content:
    content = content.replace(
        "const { logout } = useAuth();",
        "const { logout } = useAuth();\n" + state_vars
    )

# Replace the "Generate Reports" button Action
content = content.replace(
    '<Pressable className="w-full bg-white border border-slate-200 rounded-[16px] py-4 items-center justify-center flex flex-row gap-2 active:bg-slate-50 mb-2">',
    '<Pressable onPress={() => setIsReportModalOpen(true)} className="w-full bg-white border border-slate-200 rounded-[16px] py-4 items-center justify-center flex flex-row gap-2 active:bg-slate-50 mb-2">'
)

# Add the Report Modal JSX at the end, before the closing </View>
report_modal_jsx = """
      {/* Generate Reports Modal */}
      <Modal visible={isReportModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-white rounded-t-3xl p-6 h-[85%]">
            <View className="flex flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900">Generate Reports</Text>
              <Pressable onPress={() => setIsReportModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <Text className="text-slate-600 font-bold">✕</Text>
              </Pressable>
            </View>

            <View className="flex-1">
              {/* Report Types */}
              <Text className="text-sm font-bold text-slate-700 mb-3 ml-1">Report Types</Text>
              <View className="flex flex-row flex-wrap gap-2 mb-6">
                {['Purchase', 'Inventory', 'Sales', 'Billing'].map(type => (
                  <Pressable
                    key={type}
                    onPress={() => toggleReportType(type)}
                    className="flex flex-row items-center gap-2 px-4 py-2.5 rounded-xl border"
                    style={{ 
                      backgroundColor: reportTypes.includes(type) ? '#e0e7ff' : '#f8fafc',
                      borderColor: reportTypes.includes(type) ? '#4f46e5' : '#e2e8f0',
                      opacity: type === 'Purchase' ? 1 : 0.5
                    }}
                  >
                    <View className="w-4 h-4 rounded-full border items-center justify-center" style={{ borderColor: reportTypes.includes(type) ? '#4f46e5' : '#cbd5e1' }}>
                      {reportTypes.includes(type) && <View className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                    </View>
                    <Text className="font-bold text-sm" style={{ color: reportTypes.includes(type) ? '#4338ca' : '#64748b' }}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Date Filters */}
              <Text className="text-sm font-bold text-slate-700 mb-3 ml-1">Date Range</Text>
              <View className="flex flex-row flex-wrap gap-2 mb-4">
                {['single', 'range', 'month', 'year'].map(mode => (
                  <Pressable
                    key={mode}
                    onPress={() => setDateMode(mode)}
                    className="px-4 py-2 rounded-xl border"
                    style={{
                      backgroundColor: dateMode === mode ? '#fef3c7' : '#f8fafc',
                      borderColor: dateMode === mode ? '#d97706' : '#e2e8f0'
                    }}
                  >
                    <Text className="font-bold text-[13px] capitalize" style={{ color: dateMode === mode ? '#b45309' : '#64748b' }}>
                      {mode}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex flex-row gap-3 mb-6">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1 ml-1">
                    {dateMode === 'range' ? 'Start Date' : 'Date'} (YYYY-MM-DD)
                  </Text>
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-07-17"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                  />
                </View>
                {dateMode === 'range' && (
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-500 mb-1 ml-1">End Date (YYYY-MM-DD)</Text>
                    <TextInput
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="2026-07-18"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                    />
                  </View>
                )}
              </View>

              {/* Provider Selection (only if Purchase selected) */}
              {reportTypes.includes('Purchase') && (
                <View className="mb-6">
                  <Text className="text-sm font-bold text-slate-700 mb-3 ml-1">Providers</Text>
                  <View className="flex flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setSelectedProviders([])}
                      className="px-4 py-2 rounded-xl border"
                      style={{
                        backgroundColor: selectedProviders.length === 0 ? '#ecfccb' : '#f8fafc',
                        borderColor: selectedProviders.length === 0 ? '#65a30d' : '#e2e8f0'
                      }}
                    >
                      <Text className="font-bold text-[13px]" style={{ color: selectedProviders.length === 0 ? '#4d7c0f' : '#64748b' }}>
                        All Providers
                      </Text>
                    </Pressable>
                    
                    {providers.map(p => (
                      <Pressable
                        key={p.id}
                        onPress={() => toggleProvider(p.id)}
                        className="px-4 py-2 rounded-xl border"
                        style={{
                          backgroundColor: selectedProviders.includes(p.id) ? '#ecfccb' : '#f8fafc',
                          borderColor: selectedProviders.includes(p.id) ? '#65a30d' : '#e2e8f0'
                        }}
                      >
                        <Text className="font-bold text-[13px]" style={{ color: selectedProviders.includes(p.id) ? '#4d7c0f' : '#64748b' }}>
                          {p.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Pressable
              onPress={handleGenerateReport}
              disabled={reportTypes.length === 0 || !startDate.trim()}
              className="w-full rounded-2xl py-4 items-center mt-4"
              style={{ backgroundColor: (reportTypes.length === 0 || !startDate.trim()) ? '#e2e8f0' : '#4f46e5' }}
            >
              <Text className="font-bold text-base" style={{ color: (reportTypes.length === 0 || !startDate.trim()) ? '#94a3b8' : '#ffffff' }}>
                Download PDF
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
"""

if "isReportModalOpen" not in content:
    # We didn't do the second replacement yet because the first one is the source of truth
    pass

if "{/* Generate Reports Modal */}" not in content:
    content = content.replace(
        "    </View>\n  );\n}\n",
        report_modal_jsx + "\n    </View>\n  );\n}\n"
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SettingsScreen.tsx")
