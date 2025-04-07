<template>
  <div class="ui-guide-page">
    <h1>{{ $t('ui.designSystem') }}</h1>
    
    <section class="ui-section">
      <h2>{{ $t('ui.typography') }}</h2>
      <div class="showcase">
        <div class="item">
          <h1>H1: {{ $t('ui.heading') }}</h1>
          <p class="description">{{ $t('ui.headingUsage') }}</p>
        </div>
        <div class="item">
          <h2>H2: {{ $t('ui.subheading') }}</h2>
          <p class="description">{{ $t('ui.subheadingUsage') }}</p>
        </div>
        <div class="item">
          <h3>H3: {{ $t('ui.sectionHeading') }}</h3>
          <p class="description">{{ $t('ui.sectionHeadingUsage') }}</p>
        </div>
        <div class="item">
          <h4>H4: {{ $t('ui.subsectionHeading') }}</h4>
          <p class="description">{{ $t('ui.subsectionHeadingUsage') }}</p>
        </div>
        <div class="item">
          <p class="body">{{ $t('ui.bodyText') }}</p>
          <p class="description">{{ $t('ui.bodyTextUsage') }}</p>
        </div>
        <div class="item">
          <p class="small">{{ $t('ui.smallText') }}</p>
          <p class="description">{{ $t('ui.smallTextUsage') }}</p>
        </div>
      </div>
    </section>
    
    <section class="ui-section">
      <h2>{{ $t('ui.colors') }}</h2>
      <div class="color-grid">
        <div class="color-item">
          <div class="color-box primary"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.primaryColor') }}</div>
            <div class="color-variable">--primary-color</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box secondary"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.secondaryColor') }}</div>
            <div class="color-variable">--secondary-color</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box bg"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.backgroundColor') }}</div>
            <div class="color-variable">--bg-color</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box card-bg"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.cardBackground') }}</div>
            <div class="color-variable">--card-bg</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box text"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.textColor') }}</div>
            <div class="color-variable">--text-color</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box text-light"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.textColorLight') }}</div>
            <div class="color-variable">--text-color-light</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box border"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.borderColor') }}</div>
            <div class="color-variable">--border-color</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box error"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.errorColor') }}</div>
            <div class="color-variable">--error-color</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box success"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.successColor') }}</div>
            <div class="color-variable">--success-color</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-box warning"></div>
          <div class="color-info">
            <div class="color-name">{{ $t('ui.warningColor') }}</div>
            <div class="color-variable">--warning-color</div>
          </div>
        </div>
      </div>
    </section>
    
    <section class="ui-section">
      <h2>{{ $t('ui.buttons') }}</h2>
      <div class="showcase">
        <div class="item">
          <button class="btn-primary">{{ $t('ui.primaryButton') }}</button>
          <p class="description">{{ $t('ui.primaryButtonUsage') }}</p>
        </div>
        <div class="item">
          <button class="btn-primary" disabled>{{ $t('ui.disabledButton') }}</button>
          <p class="description">{{ $t('ui.disabledButtonUsage') }}</p>
        </div>
        <div class="item">
          <button class="btn-outline">{{ $t('ui.outlineButton') }}</button>
          <p class="description">{{ $t('ui.outlineButtonUsage') }}</p>
        </div>
        <div class="item">
          <button class="btn-danger">{{ $t('ui.dangerButton') }}</button>
          <p class="description">{{ $t('ui.dangerButtonUsage') }}</p>
        </div>
        <div class="item">
          <button class="btn-sm">{{ $t('ui.smallButton') }}</button>
          <p class="description">{{ $t('ui.smallButtonUsage') }}</p>
        </div>
      </div>
    </section>
    
    <section class="ui-section">
      <h2>{{ $t('ui.formElements') }}</h2>
      <div class="showcase">
        <div class="item">
          <div class="form-group">
            <label for="text-input">{{ $t('ui.textInput') }}</label>
            <input type="text" id="text-input" placeholder="Text input example">
          </div>
          <p class="description">{{ $t('ui.textInputUsage') }}</p>
        </div>
        <div class="item">
          <div class="form-group">
            <label for="select-input">{{ $t('ui.selectInput') }}</label>
            <select id="select-input">
              <option value="">{{ $t('ui.selectOption') }}</option>
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
              <option value="3">Option 3</option>
            </select>
          </div>
          <p class="description">{{ $t('ui.selectInputUsage') }}</p>
        </div>
        <div class="item">
          <div class="form-group">
            <label for="textarea-input">{{ $t('ui.textareaInput') }}</label>
            <textarea id="textarea-input" placeholder="Textarea example"></textarea>
          </div>
          <p class="description">{{ $t('ui.textareaInputUsage') }}</p>
        </div>
        <div class="item">
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox"> {{ $t('ui.checkbox') }}
            </label>
          </div>
          <p class="description">{{ $t('ui.checkboxUsage') }}</p>
        </div>
        <div class="item">
          <div class="form-group">
            <label class="radio-label">
              <input type="radio" name="radio-demo"> {{ $t('ui.radioOption') }} 1
            </label>
            <label class="radio-label">
              <input type="radio" name="radio-demo"> {{ $t('ui.radioOption') }} 2
            </label>
          </div>
          <p class="description">{{ $t('ui.radioUsage') }}</p>
        </div>
      </div>
    </section>
    
    <section class="ui-section">
      <h2>{{ $t('ui.cards') }}</h2>
      <div class="showcase">
        <div class="card-item">
          <div class="card">
            <div class="card-header">{{ $t('ui.cardHeader') }}</div>
            <div class="card-body">
              <p>{{ $t('ui.cardContent') }}</p>
            </div>
            <div class="card-footer">
              <button class="btn-primary">{{ $t('ui.action') }}</button>
            </div>
          </div>
          <p class="description">{{ $t('ui.cardUsage') }}</p>
        </div>
        
        <div class="card-item">
          <div class="card flat">
            <div class="card-body">
              <h3>{{ $t('ui.flatCard') }}</h3>
              <p>{{ $t('ui.flatCardContent') }}</p>
            </div>
          </div>
          <p class="description">{{ $t('ui.flatCardUsage') }}</p>
        </div>
      </div>
    </section>
    
    <section class="ui-section">
      <h2>{{ $t('ui.alerts') }}</h2>
      <div class="showcase">
        <div class="item full-width">
          <div class="alert-success">
            <span class="alert-icon">✓</span>
            <p>{{ $t('ui.successAlert') }}</p>
          </div>
          <p class="description">{{ $t('ui.successAlertUsage') }}</p>
        </div>
        <div class="item full-width">
          <div class="alert-error">
            <span class="alert-icon">✕</span>
            <p>{{ $t('ui.errorAlert') }}</p>
          </div>
          <p class="description">{{ $t('ui.errorAlertUsage') }}</p>
        </div>
        <div class="item full-width">
          <div class="alert-warning">
            <span class="alert-icon">⚠</span>
            <p>{{ $t('ui.warningAlert') }}</p>
          </div>
          <p class="description">{{ $t('ui.warningAlertUsage') }}</p>
        </div>
        <div class="item full-width">
          <div class="alert-info">
            <span class="alert-icon">ℹ</span>
            <p>{{ $t('ui.infoAlert') }}</p>
          </div>
          <p class="description">{{ $t('ui.infoAlertUsage') }}</p>
        </div>
      </div>
    </section>
    
    <section class="ui-section">
      <h2>{{ $t('ui.tables') }}</h2>
      <div class="showcase">
        <div class="item full-width">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ $t('ui.tableHeader') }} 1</th>
                <th>{{ $t('ui.tableHeader') }} 2</th>
                <th>{{ $t('ui.tableHeader') }} 3</th>
                <th>{{ $t('ui.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1-1</td>
                <td>Data 1-2</td>
                <td>Data 1-3</td>
                <td>
                  <button class="btn-sm">{{ $t('ui.edit') }}</button>
                </td>
              </tr>
              <tr>
                <td>Data 2-1</td>
                <td>Data 2-2</td>
                <td>Data 2-3</td>
                <td>
                  <button class="btn-sm">{{ $t('ui.edit') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="description">{{ $t('ui.tableUsage') }}</p>
        </div>
      </div>
    </section>
    
    <section class="ui-section">
      <h2>{{ $t('ui.badges') }}</h2>
      <div class="showcase">
        <div class="item">
          <span class="badge primary">{{ $t('ui.primaryBadge') }}</span>
          <p class="description">{{ $t('ui.primaryBadgeUsage') }}</p>
        </div>
        <div class="item">
          <span class="badge success">{{ $t('ui.successBadge') }}</span>
          <p class="description">{{ $t('ui.successBadgeUsage') }}</p>
        </div>
        <div class="item">
          <span class="badge warning">{{ $t('ui.warningBadge') }}</span>
          <p class="description">{{ $t('ui.warningBadgeUsage') }}</p>
        </div>
        <div class="item">
          <span class="badge danger">{{ $t('ui.dangerBadge') }}</span>
          <p class="description">{{ $t('ui.dangerBadgeUsage') }}</p>
        </div>
        <div class="item">
          <span class="badge info">{{ $t('ui.infoBadge') }}</span>
          <p class="description">{{ $t('ui.infoBadgeUsage') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, onMounted } from 'vue';

const { t } = useI18n();

// 使用Nuxt自带的useHead进行页面标题设置
const title = ref(t('ui.designSystem'));

onMounted(() => {
  document.title = title.value;
});
</script>

<style scoped>
.ui-guide-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.ui-section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
}

.ui-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: var(--text-color);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.showcase {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.item {
  flex: 0 0 calc(33.333% - 1rem);
  min-width: 250px;
  margin-bottom: 1rem;
}

.full-width {
  flex: 0 0 100%;
}

.description {
  font-size: 0.875rem;
  color: var(--text-color-light);
  margin-top: 0.5rem;
}

/* Typography styles */
h1 {
  font-size: 2rem;
  color: var(--text-color);
  margin-bottom: 1.5rem;
}

.body {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
}

.small {
  font-size: 0.875rem;
  color: var(--text-color-light);
}

/* Colors showcase */
.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.color-item {
  display: flex;
  flex-direction: column;
}

.color-box {
  height: 80px;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  border: 1px solid var(--border-color);
}

.color-info {
  display: flex;
  flex-direction: column;
}

.color-name {
  font-weight: 500;
  color: var(--text-color);
}

.color-variable {
  font-size: 0.875rem;
  color: var(--text-color-light);
  font-family: monospace;
}

.color-box.primary {
  background-color: var(--primary-color);
}

.color-box.secondary {
  background-color: var(--hover-color);
}

.color-box.bg {
  background-color: var(--bg-color);
}

.color-box.card-bg {
  background-color: var(--card-bg);
}

.color-box.text {
  background-color: var(--text-color);
}

.color-box.text-light {
  background-color: var(--text-color-light);
}

.color-box.border {
  background-color: var(--border-color);
}

.color-box.error {
  background-color: var(--error-color);
}

.color-box.success {
  background-color: var(--success-color);
}

.color-box.warning {
  background-color: var(--warning-color);
}

/* Button styles */
.btn-primary {
  background-color: var(--primary-color);
  color: var(--bg-color);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: var(--hover-color);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: var(--bg-color);
}

.btn-danger {
  background-color: var(--error-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger:hover {
  opacity: 0.9;
}

.btn-sm {
  background-color: var(--primary-color);
  color: var(--bg-color);
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

/* Form styles */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

label {
  font-weight: 500;
  color: var(--text-color-light);
}

input[type="text"],
input[type="email"],
input[type="password"],
select,
textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--input-bg);
  color: var(--text-color);
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(17, 252, 212, 0.2);
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Card styles */
.card-item {
  flex: 0 0 calc(50% - 0.75rem);
  min-width: 300px;
}

.card {
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  background-color: var(--card-bg);
  overflow: hidden;
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.03);
}

.card-body {
  padding: 1rem;
}

.card-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.card.flat {
  box-shadow: none;
  border: 1px solid var(--border-color);
}

/* Alert styles */
.alert-success,
.alert-error,
.alert-warning,
.alert-info {
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.alert-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.alert-success {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  border: 1px solid var(--success-color);
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
  border: 1px solid var(--error-color);
}

.alert-warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
  border: 1px solid var(--warning-color);
}

.alert-info {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

/* Table styles */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  background-color: rgba(0, 0, 0, 0.03);
  font-weight: 600;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Badge styles */
.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.primary {
  background-color: rgba(17, 252, 212, 0.15);
  color: var(--primary-color);
}

.badge.success {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--success-color);
}

.badge.warning {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--warning-color);
}

.badge.danger {
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--error-color);
}

.badge.info {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

@media (max-width: 768px) {
  .item, .card-item {
    flex: 0 0 100%;
  }
  
  .color-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style> 