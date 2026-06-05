import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\frontend\src\pages\Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

# ItemHistoryTab
orig = orig.replace(
    'const [searchQuery, setSearchQuery] = useState("");\n  const { data: history = [], isLoading } = useAllBillingHistory();',
    'const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("billing_item_search") || "");\n  useEffect(() => { sessionStorage.setItem("billing_item_search", searchQuery); }, [searchQuery]);\n  const { data: history = [], isLoading } = useAllBillingHistory();'
)

# CustomerHistoryTab
orig = orig.replace(
    'const [searchQuery, setSearchQuery] = useState("");\n  const { data: bills = [], isLoading } = useBillingHistory("");',
    'const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("billing_customer_search") || "");\n  useEffect(() => { sessionStorage.setItem("billing_customer_search", searchQuery); }, [searchQuery]);\n  const { data: bills = [], isLoading } = useBillingHistory("");'
)

# Billing Main Component
old_billing_state = '''  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");'''

new_billing_state = '''  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("billing_active_tab") || "active");
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("billing_active_search") || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState(() => sessionStorage.getItem("billing_active_qty") || "");
  const [customerName, setCustomerName] = useState(() => sessionStorage.getItem("billing_active_customer") || "");

  useEffect(() => { sessionStorage.setItem("billing_active_tab", activeTab); }, [activeTab]);
  useEffect(() => { sessionStorage.setItem("billing_active_search", searchQuery); }, [searchQuery]);
  useEffect(() => { sessionStorage.setItem("billing_active_qty", quantity); }, [quantity]);
  useEffect(() => { sessionStorage.setItem("billing_active_customer", customerName); }, [customerName]);'''

orig = orig.replace(old_billing_state, new_billing_state)

# Replace Tabs defaultValue with value+onValueChange
orig = orig.replace(
    '<Tabs defaultValue="active" className="w-full">',
    '<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(orig)
print('Persisted Billing State across navigations.')
