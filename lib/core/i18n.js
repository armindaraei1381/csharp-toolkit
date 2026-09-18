'use babel';

/**
 * i18n — minimal bilingual (English / Persian) message catalogue for all
 * user-facing strings. Selected via the `language` setting; dialogs are
 * rendered RTL when Persian is active.
 *
 * Author: Armin Daraei
 */

import { configKey } from './package-meta';

const MESSAGES = {
  en: {
    'menu.customTemplates': 'Custom templates',
    'kind.class': 'class',
    'kind.interface': 'interface',
    'kind.enum': 'enum',
    'kind.struct': 'struct',
    'kind.abstract-class': 'abstract class',
    'kind.static-class': 'static class',
    'kind.record': 'record',
    'kind.record-struct': 'record struct',
    'kind.unit-test': 'unit test class',
    'kind.custom': 'file',
    'kind.mvc-controller': 'MVC controller',
    'kind.api-controller': 'API controller',
    'kind.razor-page': 'Razor page',
    'kind.uwp-page': 'UWP page',
    'kind.uwp-window': 'UWP window',
    'kind.uwp-usercontrol': 'UWP user control',
    'kind.uwp-resource': 'resource file',
    'kind.xunit-test': 'xUnit test class',
    'kind.nunit-test': 'NUnit test class',
    'kind.mstest-test': 'MSTest test class',
    'dialog.prompt': 'Name of the new {kind}:',
    'dialog.placeholder': 'Type a valid C# identifier…',
    'dialog.fileHint': 'Will create: {file}',
    'validator.empty': 'The name cannot be empty.',
    'validator.start': 'A C# identifier cannot start with a digit.',
    'validator.char': 'Only letters, digits and `_` are allowed in a C# identifier.',
    'validator.filename': 'The name contains characters that are illegal in file names (\\ / : * ? " < > |).',
    'validator.reserved': '“{keyword}” is a reserved C# keyword and cannot be used as a name.',
    'validator.contextual': '“{keyword}” is a contextual C# keyword — using it as a name is discouraged and may break your code.',
    'error.exists': 'A file named “{file}” already exists.',
    'error.noTarget': 'No folder or project is available. Open a project folder in Pulsar first.',
    'error.noNamespace': 'Cannot determine a namespace — the target folder belongs to no open project or workspace.',
    'info.namespaceFallback': 'No .csproj found — namespace derived from the workspace root: {namespace}',
    'warning.ambiguousProject': 'Multiple project files found; using “{file}”.',
    'success.created': '{kind} “{name}” was created.',
    'success.createdPair': '“{name}” was created ({count} files).',
    'error.templateRead': 'Could not read the template at “{path}”.',
    'error.write': 'Could not write “{path}”: {message}',
    'error.unexpected': 'Unexpected error: {message}',
    'noEditor': 'Open a C# file first.',
    'constructor.notCSharp': 'The active file is not a C# file.',
    'constructor.noClass': 'Place the cursor inside a C# class first.',
    'constructor.noProperties': 'No settable property (`set`/`init`) was found in this class.',
    'constructor.pickerTitle': 'Choose the properties to assign in the constructor',
    'constructor.add': 'Add Constructor',
    'constructor.all': 'All',
    'constructor.none': 'None',
    'button.cancel': 'Cancel',
    'constructor.noneSelected': 'No property was selected — nothing to do.',
    'constructor.inserted': 'Constructor with {count} parameter(s) added to {name}.',
    'constructor.missingUsings': 'Missing using directives: {namespaces}',
    'button.addUsings': 'Add usings',
    'button.skip': 'Not now',
    'info.customTemplatesLoaded': '{count} custom template(s) loaded.',
    'createProject.selectPrompt': 'Select a .NET project template:',
    'createProject.selectPlaceholder': 'Filter templates…',
    'createProject.namePrompt': 'Name of the new .NET project:',
    'createProject.namePlaceholder': 'e.g. MyConsoleApp',
    'createProject.pathPrompt': 'Destination folder for the project:',
    'createProject.pathPlaceholder': '/absolute/path/to/parent/folder',
    'createProject.creating': 'Creating project “{name}” (dotnet new {short})…',
    'createProject.success': 'Project “{name}” was created at {path}.',
    'createProject.failed': '`dotnet new` failed with exit code {code}.',
    'createProject.errorDotnetMissing': 'The `dotnet` CLI was not found. Please install the .NET SDK and make sure `dotnet` is on your PATH.',
    'createProject.openQuestion': 'Open project “{name}”?',
    'createProject.openHere': 'Open in this window',
    'createProject.openNewWindow': 'Open in a new window',
    'createProject.error.targetExists': 'The folder “{path}” already exists.',
    'createProject.error.invalidDir': 'The folder “{path}” does not exist or is not a directory.',
    'createProject.error.invalidName': 'The project name contains characters that are illegal in folder names (\\ / : * ? " < > |).'
  },
  fa: {
    'menu.customTemplates': 'تمپلیت‌های سفارشی',
    'kind.class': 'کلاس',
    'kind.interface': 'اینترفیس',
    'kind.enum': 'enum',
    'kind.struct': 'struct',
    'kind.abstract-class': 'کلاس انتزاعی',
    'kind.static-class': 'کلاس استاتیک',
    'kind.record': 'record',
    'kind.record-struct': 'record struct',
    'kind.unit-test': 'کلاس تست واحد',
    'kind.custom': 'فایل',
    'kind.mvc-controller': 'کنترلر MVC',
    'kind.api-controller': 'کنترلر API',
    'kind.razor-page': 'صفحه‌ی Razor',
    'kind.uwp-page': 'صفحه‌ی UWP',
    'kind.uwp-window': 'پنجره‌ی UWP',
    'kind.uwp-usercontrol': 'یوزرکنترل UWP',
    'kind.uwp-resource': 'فایل ریسورس',
    'kind.xunit-test': 'کلاس تست xUnit',
    'kind.nunit-test': 'کلاس تست NUnit',
    'kind.mstest-test': 'کلاس تست MSTest',
    'dialog.prompt': 'نام {kind} جدید:',
    'dialog.placeholder': 'یک شناسه‌ی معتبر #C وارد کنید…',
    'dialog.fileHint': 'فایل ساخته خواهد شد: {file}',
    'validator.empty': 'نام نمی‌تواند خالی باشد.',
    'validator.start': 'شناسه‌ی #C نمی‌تواند با رقم شروع شود.',
    'validator.char': 'شناسه‌ی #C فقط می‌تواند شامل حروف، ارقام و خط تیره‌ی زیرین (_) باشد.',
    'validator.filename': 'نام شامل کاراکترهای غیرمجاز در نام فایل است (\\ / : * ? " < > |).',
    'validator.reserved': '«{keyword}» یک کلمه‌ی کلیدی رزروشده‌ی #C است و نمی‌توان به‌عنوان نام استفاده کرد.',
    'validator.contextual': '«{keyword}» یک کلمه‌ی کلیدی متنی (contextual) #C است؛ انتخاب آن به‌عنوان نام توصیه نمی‌شود و ممکن است باعث خطا شود.',
    'error.exists': 'فایلی با نام «{file}» از قبل وجود دارد.',
    'error.noTarget': 'هیچ پوشه یا پروژه‌ای در دسترس نیست. ابتدا یک پوشه را در Pulsar باز کنید.',
    'error.noNamespace': 'امکان تعیین namespace وجود ندارد؛ پوشه‌ی هدف به هیچ پروژه یا ورک‌اسپیسی تعلق ندارد.',
    'info.namespaceFallback': 'فایل csproj پیدا نشد؛ namespace از ریشه‌ی ورک‌اسپیس ساخته شد: {namespace}',
    'warning.ambiguousProject': 'چند فایل پروژه پیدا شد؛ از «{file}» استفاده می‌شود.',
    'success.created': '{kind} «{name}» ساخته شد.',
    'success.createdPair': '«{name}» ساخته شد ({count} فایل).',
    'error.templateRead': 'خواندن تمپلیت از «{path}» ممکن نشد.',
    'error.write': 'نوشتن فایل «{path}» ناموفق بود: {message}',
    'error.unexpected': 'خطای غیرمنتظره: {message}',
    'noEditor': 'ابتدا یک فایل #C باز کنید.',
    'constructor.notCSharp': 'فایل فعال، فایل #C نیست.',
    'constructor.noClass': 'مکان‌نما را داخل یک کلاس #C قرار دهید.',
    'constructor.noProperties': 'هیچ property با setter یا init در این کلاس پیدا نشد.',
    'constructor.pickerTitle': 'propertyهایی را که باید در constructor مقداردهی شوند انتخاب کنید',
    'constructor.add': 'افزودن Constructor',
    'constructor.all': 'همه',
    'constructor.none': 'هیچ‌کدام',
    'button.cancel': 'انصراف',
    'constructor.noneSelected': 'هیچ property انتخاب نشد.',
    'constructor.inserted': 'Constructor با {count} پارامتر به {name} اضافه شد.',
    'constructor.missingUsings': 'این usingها یافت نشدند: {namespaces}',
    'button.addUsings': 'افزودن usingها',
    'button.skip': 'فعلاً نه',
    'info.customTemplatesLoaded': '{count} تمپلیت سفارشی بارگذاری شد.',
    'createProject.selectPrompt': 'یک تمپلیت پروژه‌ی دات‌نت انتخاب کنید:',
    'createProject.selectPlaceholder': 'فیلتر تمپلیت‌ها…',
    'createProject.namePrompt': 'نام پروژه‌ی جدید دات‌نت:',
    'createProject.namePlaceholder': 'مثلاً MyConsoleApp',
    'createProject.pathPrompt': 'پوشه‌ی مقصد پروژه:',
    'createProject.pathPlaceholder': '/مسیر/مطلق/پوشه‌ی/والد',
    'createProject.creating': 'در حال ساخت پروژه‌ی «{name}» (dotnet new {short})…',
    'createProject.success': 'پروژه‌ی «{name}» در {path} ساخته شد.',
    'createProject.failed': 'اجرای `dotnet new` با کد خطای {code} ناموفق بود.',
    'createProject.errorDotnetMissing': 'دستور `dotnet` پیدا نشد. لطفاً .NET SDK را نصب کنید و مطمئن شوید `dotnet` در PATH است.',
    'createProject.openQuestion': 'پروژه‌ی «{name}» باز شود؟',
    'createProject.openHere': 'بازکردن در همین پنجره',
    'createProject.openNewWindow': 'بازکردن در پنجره‌ی جدید',
    'createProject.error.targetExists': 'پوشه‌ی «{path}» از قبل وجود دارد.',
    'createProject.error.invalidDir': 'پوشه‌ی «{path}» وجود ندارد یا یک دایرکتوری نیست.',
    'createProject.error.invalidName': 'نام پروژه شامل کاراکترهای غیرمجاز در نام پوشه است (\\ / : * ? " < > |).'
  }
};

const RTL_LANGUAGES = new Set(['fa']);

function currentLanguage() {
  const configured = atom.config.get(configKey('language'));
  return configured && MESSAGES[configured] ? configured : 'en';
}

const i18n = {
  t(key, params = {}) {
    const language = currentLanguage();
    const template =
      MESSAGES[language][key] != null ? MESSAGES[language][key] : MESSAGES.en[key] != null ? MESSAGES.en[key] : key;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
    );
  },
  language: currentLanguage,
  isRTL: () => RTL_LANGUAGES.has(currentLanguage())
};

export default i18n;
