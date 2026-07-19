import os

path = r"d:\Duro Tracker\frontend\src\screens\admin\SettingsScreen.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the native import
content = content.replace("import DateTimePicker from '@react-native-community/datetimepicker';\n", "")

# Add date-fns import if missing
if "import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from 'date-fns';" not in content:
    content = content.replace(
        "import * as Sharing from 'expo-sharing';",
        "import * as Sharing from 'expo-sharing';\nimport { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';"
    )

# Inject Custom Date Picker Component before SettingsScreen component
custom_date_picker_code = """
const CustomDatePickerModal = ({ visible, onClose, onSelect, initialDate }: { visible: boolean; onClose: () => void; onSelect: (date: string) => void; initialDate?: string }) => {
  const [currentMonth, setCurrentMonth] = React.useState(initialDate ? parseISO(initialDate) : new Date());

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateFormat = "yyyy-MM-dd";
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 justify-center items-center bg-black/50 p-4" onPress={onClose}>
        <Pressable className="bg-white rounded-3xl p-4 w-full max-w-[340px]" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row justify-between items-center mb-4 px-2">
            <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-slate-100 rounded-full">
              <Text className="font-bold text-slate-600">{'<'}</Text>
            </Pressable>
            <Text className="text-lg font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</Text>
            <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-slate-100 rounded-full">
              <Text className="font-bold text-slate-600">{'>'}</Text>
            </Pressable>
          </View>

          <View className="flex-row mb-2">
            {days.map(day => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-xs font-bold text-slate-400">{day}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {calendarDays.map((day, i) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = initialDate ? isSameDay(day, parseISO(initialDate)) : false;
              
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    onSelect(format(day, dateFormat));
                    onClose();
                  }}
                  className="w-[14.28%] aspect-square justify-center items-center p-1"
                >
                  <View className={`w-full h-full justify-center items-center rounded-full ${isSelected ? 'bg-indigo-600' : ''}`}>
                    <Text className={`font-medium ${!isCurrentMonth ? 'text-slate-300' : isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {format(day, 'd')}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          
          <Pressable onPress={onClose} className="mt-4 py-3 bg-slate-100 rounded-xl items-center">
            <Text className="font-bold text-slate-700">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
"""

if "CustomDatePickerModal =" not in content:
    content = content.replace(
        "export default function SettingsScreen() {",
        custom_date_picker_code + "\nexport default function SettingsScreen() {"
    )

# Replace renderDatePicker
old_render_date_picker = """const renderDatePicker = (value: string, onChange: (val: string) => void, placeholder: string, isEnd = false) => {
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

new_render_date_picker = """const renderDatePicker = (value: string, onChange: (val: string) => void, placeholder: string, isEnd = false) => {
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
        <CustomDatePickerModal 
          visible={showPicker} 
          onClose={() => setShowPicker(false)} 
          onSelect={(d) => onChange(d)} 
          initialDate={value || undefined}
        />
      </>
    );
  };"""

content = content.replace(old_render_date_picker, new_render_date_picker)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SettingsScreen.tsx")
