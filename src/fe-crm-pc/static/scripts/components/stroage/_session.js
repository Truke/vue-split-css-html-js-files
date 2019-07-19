var fakeStorage = {
  _data: {},

  setItem: function (name, value) {
    // return this._data[id] = String(val);
    var expires = "";
    var date = new Date();
    date.setTime(date.getTime()+(30*60*1000));  
    expires = "; expires="+date.toGMTString();
    document.cookie = name+"="+escape(value)+expires+"; path=/";
  },

  getItem: function (c_name) {
    // return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
    if (document.cookie.length>0)
      {
      c_start=document.cookie.indexOf(c_name + "=")
      if (c_start!=-1)
        {
        c_start=c_start + c_name.length+1
        c_end=document.cookie.indexOf(";",c_start)
        if (c_end==-1) c_end=document.cookie.length
        return unescape(document.cookie.substring(c_start,c_end))
        }
      }
    return "";
  },
  removeItem:function () {
      var exp = new Date();
      exp.setTime(exp.getTime() - 1);
      var cval=this.getItem(name);
      if(cval!=null)
          document.cookie= name + "="+cval+";expires="+exp.toGMTString();
  }

  // removeItem: function (name) {
  //   // return delete this._data[id];
  // },

  // clear: function () {
  //   return this._data = {};
  // }
};

function sessionStorageSupported() {
  var testKey = "__test__";
  var storage = window.sessionStorage;

  try {
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}


module.exports = sessionStorageSupported() ? window.sessionStorage : fakeStorage;
