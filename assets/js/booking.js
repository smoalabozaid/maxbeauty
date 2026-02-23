document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step-content');
    const nextBtns = document.querySelectorAll('.next-step');
    const prevBtns = document.querySelectorAll('.prev-step');
    let currentStep = 0;

    // Service Retrieval with Defaults
    const defaultServices = {
        'شعر': [
            { id: 1, name: 'تصفيف (سشوار)', price: '150 QAR', desc: 'تصفيف احترافي لجميع أنواع الشعر' },
            { id: 2, name: 'قص شعر', price: '200 QAR', desc: 'قصات حديثة تواكب الموضة العالمية' },
            { id: 3, name: 'صبغة كاملة', price: '600 QAR', desc: 'أجود أنواع الصبغات العالمية الخالية من الأمونيا' },
            { id: 4, name: 'علاج بروتين', price: '1200 QAR', desc: 'تنعيم ومعالجة الشعر التالف' }
        ],
        'بشرة': [
            { id: 5, name: 'تنظيف عميق', price: '400 QAR', desc: 'تنظيف المسام وإزالة الشوائب' },
            { id: 6, name: 'هيدرافيشل', price: '700 QAR', desc: 'تقنية متطورة لترطيب ونضارة البشرة' },
            { id: 7, name: 'ماسك الذهب', price: '500 QAR', desc: 'جلسة ملكية لنضارة فورية' }
        ],
        'أظافر': [
            { id: 8, name: 'مانيكير وباديكير', price: '250 QAR', desc: 'عناية متكاملة لليدين والقدمين' },
            { id: 9, name: 'صبغة أظافر جل', price: '150 QAR', desc: 'ألوان جذابة تدوم طويلاً' },
            { id: 10, name: 'اكستنشن أظافر', price: '400 QAR', desc: 'تطويل الأظافر بشكل طبيعي' }
        ],
        'مكياج': [
            { id: 11, name: 'مكياج سهرة', price: '800 QAR', desc: 'إطلالة ساحرة لمناسباتكِ الخاصة' },
            { id: 12, name: 'مكياج ناعم', price: '500 QAR', desc: 'إطلالة يومية طبيعية وأنيقة' },
            { id: 13, name: 'مكياج عروس', price: '2500 QAR', desc: 'باقة العروس المتكاملة' }
        ]
    };

    // Service Retrieval from Supabase
    async function getServices() {
        const { data, error } = await window.supabaseClient.from('services').select('*');
        if (error) {
            console.error('Error fetching services:', error);
            return {};
        }
        return data.reduce((acc, s) => {
            if (!acc[s.category]) acc[s.category] = [];
            acc[s.category].push({ id: s.id, name: s.name, price: s.price, desc: s.description });
            return acc;
        }, {});
    }

    // Data Store for Booking
    const bookingData = {
        category: '',
        service: '',
        price: '',
        date: '',
        time: '',
        customer: {
            name: '',
            phone: ''
        }
    };

    // 1. Category Selection
    document.querySelectorAll('.option-item[data-type="category"]').forEach(item => {
        item.addEventListener('click', async () => {
            const parentGrid = item.parentElement;
            parentGrid.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));

            item.classList.add('selected');
            const category = item.dataset.value;
            bookingData.category = category;

            // Populate Sub-Services
            await renderSubServices(category);
        });
    });

    async function renderSubServices(category) {
        const subGrid = document.getElementById('sub-services-grid');
        const allServices = await getServices();
        const services = allServices[category] || [];

        if (services.length === 0) {
            subGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">لا توجد خدمات حالياً في هذه الفئة.</p>';
            return;
        }

        subGrid.innerHTML = services.map(s => `
            <div class="option-item sub-service-item" data-value="${s.name}" data-price="${s.price}">
                <strong>${s.name}</strong><br>
                <small>${s.price}</small><br>
                <span style="font-size: 0.8rem; color: #666;">${s.desc}</span>
            </div>
        `).join('');

        // Add Listeners to new items
        subGrid.querySelectorAll('.sub-service-item').forEach(item => {
            item.addEventListener('click', () => {
                subGrid.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
                item.classList.add('selected');
                bookingData.service = item.dataset.value;
                bookingData.price = item.dataset.price;
            });
        });
    }

    // 2. Date and Time Selection
    const dateInput = document.getElementById('booking-date');
    const timeInput = document.getElementById('booking-time');

    async function renderTimeSlots(date) {
        // Fetch Settings and Bookings from Supabase
        const { data: settings } = await window.supabaseClient.from('admin_settings').select('value').eq('key', 'business_hours').single();
        const { data: appointments } = await window.supabaseClient.from('appointments').select('appointment_time').eq('appointment_date', date).neq('status', 'cancelled');

        const hours = settings ? settings.value : { "start": 10, "end": 18 };
        const takenSlots = appointments ? appointments.map(a => a.appointment_time) : [];

        let html = '<option value="">اختر الوقت المناسب</option>';

        for (let i = hours.start; i < hours.end; i++) {
            const hour12 = i > 12 ? i - 12 : i;
            const ampm = i >= 12 ? 'مساءً' : 'صباحاً';
            const timeStr = `${hour12}:00 ${ampm}`;

            const isTaken = takenSlots.includes(timeStr);

            if (isTaken) {
                html += `<option value="${timeStr}" disabled style="color: #ccc;">${timeStr} (محجوز)</option>`;
            } else {
                html += `<option value="${timeStr}">${timeStr}</option>`;
            }
        }
        timeInput.innerHTML = html;
        bookingData.time = '';
    }

    if (dateInput) {
        dateInput.addEventListener('change', async (e) => {
            bookingData.date = e.target.value;
            await renderTimeSlots(e.target.value);
        });
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    if (timeInput) {
        timeInput.addEventListener('change', (e) => {
            bookingData.time = e.target.value;
        });
    }

    const updateSteps = () => {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });
    };

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                if (currentStep === 0 && !bookingData.category) {
                    alert('الرجاء اختيار نوع الخدمة أولاً');
                    return;
                }
                if (currentStep === 1 && !bookingData.service) {
                    alert('الرجاء اختيار الخدمة');
                    return;
                }
                if (currentStep === 2 && (!bookingData.date || !bookingData.time)) {
                    alert('الرجاء تحديد التاريخ والوقت');
                    return;
                }

                currentStep++;
                updateSteps();
                window.scrollTo({ top: document.querySelector('#booking').offsetTop - 100, behavior: 'smooth' });
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateSteps();
            }
        });
    });

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            bookingData.customer.name = document.getElementById('cust-name').value;
            bookingData.customer.phone = document.getElementById('cust-phone').value;

            if (!bookingData.customer.name || !bookingData.customer.phone || !bookingData.date || !bookingData.time) {
                alert('الرجاء إكمال كافة البيانات');
                return;
            }

            // Final Double-Booking Check on Supabase
            const { data: existing } = await window.supabaseClient.from('appointments')
                .select('id')
                .eq('appointment_date', bookingData.date)
                .eq('appointment_time', bookingData.time)
                .neq('status', 'cancelled');

            if (existing && existing.length > 0) {
                alert('عذراً، هذا الموعد تم حجزه للتو. يرجى اختيار موعد آخر.');
                renderTimeSlots(bookingData.date);
                return;
            }

            const { error } = await window.supabaseClient.from('appointments').insert({
                customer_name: bookingData.customer.name,
                customer_phone: bookingData.customer.phone,
                category: bookingData.category,
                service_name: bookingData.service,
                price: bookingData.price,
                appointment_date: bookingData.date,
                appointment_time: bookingData.time,
                status: 'pending'
            });

            if (error) {
                alert('خطأ في إرسال الحجز: ' + error.message);
            } else {
                alert('تم استلام طلب الحجز بنجاح! سنتواصل معكِ قريباً لتأكيد الموعد.');
                bookingForm.reset();
                location.reload();
            }
        });
    }
});
