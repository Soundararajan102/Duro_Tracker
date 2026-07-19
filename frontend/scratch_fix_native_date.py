import os

path = r"d:\Duro Tracker\frontend\src\screens\admin\SettingsScreen.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

if "import DateTimePicker from '@react-native-community/datetimepicker';" not in content:
    content = content.replace(
        "import * as Sharing from 'expo-sharing';",
        "import * as Sharing from 'expo-sharing';\nimport DateTimePicker from '@react-native-community/datetimepicker';"
    )

state_vars_old = """  const [selectedProviders, setSelectedProviders] = React.useState<string[]>([]);
  const { data: providers = [] } = useProviders();"""

state_vars_new = """  const [selectedProviders, setSelectedProviders] = React.useState<string[]>([]);
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const { data: providers = [] } = useProviders();"""

content = content.replace(state_vars_old, state_vars_new)

inline_date_picker_old = """const renderDatePicker = (value: string, onChange: (val: string) => void, placeholder: string) => {
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
  };"""

inline_date_picker_new = """const renderDatePicker = (value: string, onChange: (val: string) => void, placeholder: string, isEnd = false) => {
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

    const showPicker = isEnd ? showEndPicker : showStartPicker;
    const setShowPicker = isEnd ? setShowEndPicker : setShowStartPicker;

    const onDateChange = (event: any, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
      if (selectedDate) {
        onChange(selectedDate.toISOString().split('T')[0]);
      }
    };

    return (
      <>
        <Pressable 
          onPress={() => setShowPicker(true)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
        >
          <Text className={value ? "text-slate-900" : "text-slate-400"}>
            {value || placeholder}
          </Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </>
    );
  };"""

content = content.replace(inline_date_picker_old, inline_date_picker_new)

# Update the render call for end_date to pass isEnd=true
old_render_end = """{renderDatePicker(endDate, setEndDate, "2026-07-18")}"""
new_render_end = """{renderDatePicker(endDate, setEndDate, "2026-07-18", true)}"""

content = content.replace(old_render_end, new_render_end)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SettingsScreen.tsx")
