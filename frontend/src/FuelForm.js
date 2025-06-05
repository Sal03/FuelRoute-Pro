import React, { useState } from 'react';


const FuelForm = () => {
  const [formData, setFormData] = useState({
    fuelType: '',
    volume: '',
    origin: '',
    destination: '',
    transportMode: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', formData);
    // In future: send this to backend via API
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Fuel Type:
        <select name="fuelType" onChange={handleChange} required>
          <option value="">Select</option>
          <option value="hydrogen">Hydrogen</option>
          <option value="methanol">Methanol</option>
          <option value="ammonia">Ammonia</option>
        </select>
      </label>
      <br /><br />

      <label>
        Volume (in tons):
        <input type="number" name="volume" onChange={handleChange} required />
      </label>
      <br /><br />

      <label>
        Origin:
        <input type="text" name="origin" onChange={handleChange} required />
      </label>
      <br /><br />

      <label>
        Destination:
        <input type="text" name="destination" onChange={handleChange} required />
      </label>
      <br /><br />

      <label>
        Transport Mode:
        <select name="transportMode" onChange={handleChange} required>
          <option value="">Select</option>
          <option value="truck">Truck</option>
          <option value="rail">Rail</option>
          <option value="ship">Ship</option>
        </select>
      </label>
      <br /><br />

      <button type="submit">Estimate Cost</button>
    </form>
  );
};

export default FuelForm;
